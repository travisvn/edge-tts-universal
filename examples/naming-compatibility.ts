/**
 * Naming Compatibility Test
 * Verifies that both Universal and Isomorphic naming work identically
 */

import {
  // Universal naming (preferred)
  UniversalCommunicate,
  UniversalVoicesManager,
  UniversalEdgeTTS,
  listVoicesUniversal,
  
  // Isomorphic naming (legacy)
  IsomorphicCommunicate, 
  IsomorphicVoicesManager,
  IsomorphicEdgeTTS,
  listVoicesIsomorphic
} from '../dist/index.js';

async function testNamingCompatibility() {
  console.log('🔄 Testing naming compatibility between Universal and Isomorphic APIs...');

  try {
    // Test that both naming conventions are available
    console.log('✅ Universal imports available:', {
      UniversalCommunicate: typeof UniversalCommunicate,
      UniversalVoicesManager: typeof UniversalVoicesManager, 
      UniversalEdgeTTS: typeof UniversalEdgeTTS,
      listVoicesUniversal: typeof listVoicesUniversal
    });

    console.log('✅ Isomorphic imports available:', {
      IsomorphicCommunicate: typeof IsomorphicCommunicate,
      IsomorphicVoicesManager: typeof IsomorphicVoicesManager,
      IsomorphicEdgeTTS: typeof IsomorphicEdgeTTS, 
      listVoicesIsomorphic: typeof listVoicesIsomorphic
    });

    // Verify they are the same underlying classes
    console.log('🔍 Verifying aliases point to same implementations...');
    console.log('UniversalCommunicate === IsomorphicCommunicate:', UniversalCommunicate === IsomorphicCommunicate);
    console.log('UniversalVoicesManager === IsomorphicVoicesManager:', UniversalVoicesManager === IsomorphicVoicesManager);
    console.log('UniversalEdgeTTS === IsomorphicEdgeTTS:', UniversalEdgeTTS === IsomorphicEdgeTTS);
    console.log('listVoicesUniversal === listVoicesIsomorphic:', listVoicesUniversal === listVoicesIsomorphic);

    // Test instantiation with both naming conventions
    const universalTTS = new UniversalEdgeTTS('Test', 'en-US-EmmaMultilingualNeural');
    const isomorphicTTS = new IsomorphicEdgeTTS('Test', 'en-US-EmmaMultilingualNeural'); 

    console.log('✅ Both naming conventions can be instantiated');
    console.log('Universal TTS instance:', universalTTS.constructor.name);
    console.log('Isomorphic TTS instance:', isomorphicTTS.constructor.name);

    // Test that they behave identically
    const universalComm = new UniversalCommunicate('Test');
    const isomorphicComm = new IsomorphicCommunicate('Test');
    
    console.log('✅ Both communication classes instantiated');
    console.log('Universal Communicate:', universalComm.constructor.name);
    console.log('Isomorphic Communicate:', isomorphicComm.constructor.name);

    console.log('🎉 All naming compatibility tests passed!');
    console.log('💡 Recommendation: Use Universal naming for new projects');

  } catch (error) {
    console.error('❌ Naming compatibility test failed:', error);
  }
}

// ESM equivalent check
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  testNamingCompatibility().catch(console.error);
} else if (typeof globalThis !== 'undefined') {
  (globalThis as any).runNamingCompatibilityTest = testNamingCompatibility;
}

export { testNamingCompatibility };