/**
 * Test script to verify TTS works with markdown content and emoji removal
 * This tests the actual TTS synthesis with your markdown test content
 */

import { EdgeTTS, removeIncompatibleCharacters } from './dist/index.js';
import fs from 'fs';


async function testMarkdownTTS() {
    console.log('🎯 Testing TTS with markdown content and table skipping...\n');

  const markdownContent = `**Time: 16:54, Monday, September 1, 2025 (GMT+2)**

## **🧪 TEST RESPONSE: ADVANCED MARKDOWN RENDERING**

### **System Performance Dashboard**

| Category | Status Assessment | Strategic Priority | Emphasis |
|----------|-------------------|-------------------|----------|
| **Infrastructure** | Docker dev/prod containers established | High - deployment pipeline | *Solid foundation* |
| **Cardio Fitness** | Walking HR plateau at 100bpm | Medium - modality diversification | **Intensity ceiling** |
| **Nutrition** | Burger + post-meal walking protocol | Medium - macro optimization | *Good timing* |
| **Back Health** | Manageable with movement | High - consistent management | **Ongoing focus** |
| **Real Estate** | Dream apartment viewing scheduled | Critical - life upgrade | *Massive opportunity* |

### **Current Development Status**

**Containerization Progress:**
- Dev environment operational
- Production container configured  
- Deployment pipeline in development
- *Short-term velocity trade-off* for long-term gains

**Performance Metrics:**
- Coding focus: **Sustained deep work**
- Energy management: *Post-nutrition optimization*
- Physical activity: **Cardio intensity challenge**

### **Immediate Action Items**

- Complete Docker deployment automation
- Schedule higher-intensity cardio sessions  
- Prepare apartment inspection checklist
- *Maintain back care protocol*

### **Risk Assessment**

***No critical issues detected*** - all systems operating within expected parameters. The *container strategy* is exactly the right architectural direction despite temporary velocity impact.

**The advanced markdown rendering is fully operational with your specified emphasis system.** The table structure provides clear visual prioritization while maintaining informational density.

How does this formatting work with your new rendering capabilities?`;

  try {
    // Initialize TTS with original markdown content and specified prosody settings
    const tts = new EdgeTTS(markdownContent, "en-US-AndrewMultilingualNeural", {
      rate: "+20%",    // 20% faster
      volume: "+15%",  // 15% louder
      pitch: "-5Hz",   // 5Hz lower pitch
      linearizeTables: true  // Enable table linearization
      // can also  do skipTables: true  // Skip tables entirely
    });
    
    console.log('✅ TTS initialized successfully');
    console.log('🎤 Testing TTS synthesis with markdown content...\n');

    console.log('📝 Test: Markdown content with emojis and formatting');
    console.log('📄 Input length:', markdownContent.length, 'characters');
    
    // Debug: Show what the skipped tables text looks like
    console.log('\n🔍 Debug: Testing table skipping directly:');
    const { removeIncompatibleCharacters } = await import('./dist/index.js');
    const debugSkipped = removeIncompatibleCharacters(markdownContent, { skipTables: true });
    console.log('📄 Skipped tables text length:', debugSkipped.length, 'characters');
    console.log('📄 First 500 characters of skipped tables text:');
    console.log(debugSkipped.substring(0, 500) + '...');
    
    try {
      // Test the synthesize method with the markdown content
      const result = await tts.synthesize();
      
      if (result && result.audio) {
        console.log(`✅ Success: Generated audio (${result.audio.size || result.audio.length} bytes)`);
        
        // Save audio file for verification
        const filename = `test-markdown-content.mp3`;
        
        // Handle both Blob and Buffer types
        if (result.audio instanceof Blob) {
          const arrayBuffer = await result.audio.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(filename, buffer);
        } else {
          fs.writeFileSync(filename, result.audio);
        }
        console.log(`💾 Saved audio to: ${filename}`);
        
        // Test the emoji removal function directly
        console.log('\n🔍 Testing emoji removal function directly:');
        const { removeIncompatibleCharacters } = await import('./dist/index.js');
        const cleanedText = removeIncompatibleCharacters(markdownContent);
        console.log('📄 Cleaned text length:', cleanedText.length, 'characters');
        console.log('📄 First 200 characters of cleaned text:');
        console.log(cleanedText.substring(0, 200) + '...');
        
      } else {
        console.log('❌ Failed: No audio generated');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n🎉 TTS markdown content test completed!');
    console.log('📁 Check the generated .mp3 file to verify audio quality');

  } catch (error) {
    console.error('❌ TTS initialization failed:', error.message);
  }
}

// Run the test
testMarkdownTTS().catch(console.error);
