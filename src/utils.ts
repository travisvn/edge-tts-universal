import { v4 as uuidv4 } from 'uuid';
import { TTSConfig } from './tts_config';
import { ValueError } from "./exceptions";
import escape from 'xml-escape';
import emojiRegex from 'emoji-regex';

/**
 * Parses text-based WebSocket messages to extract headers and data.
 * @param message - Buffer containing the message to parse
 * @returns Tuple of headers object and data buffer
 */
export function getHeadersAndDataFromText(message: Buffer): [{ [key: string]: string }, Buffer] {
  const headerLength = message.indexOf('\r\n\r\n');
  const headers: { [key: string]: string } = {};
  const headerString = message.subarray(0, headerLength).toString('utf-8');
  if (headerString) {
    const headerLines = headerString.split('\r\n');
    for (const line of headerLines) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        headers[key] = value.trim();
      }
    }
  }

  return [headers, message.subarray(headerLength + 2)];
}

/**
 * Parses binary WebSocket messages to extract headers and data.
 * @param message - Buffer containing the binary message to parse
 * @returns Tuple of headers object and data buffer
 */
export function getHeadersAndDataFromBinary(message: Buffer): [{ [key: string]: string }, Buffer] {
  const headerLength = message.readUInt16BE(0);
  const headers: { [key: string]: string } = {};
  const headerString = message.subarray(2, headerLength + 2).toString('utf-8');
  if (headerString) {
    const headerLines = headerString.split('\r\n');
    for (const line of headerLines) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        headers[key] = value.trim();
      }
    }
  }

  return [headers, message.subarray(headerLength + 2)];
}

/**
 * Removes control characters and emojis that are incompatible with TTS processing.
 * @param text - Input text to clean
 * @returns Text with control characters and emojis removed
 */
export function removeIncompatibleCharacters(text: string, options: { linearizeTables?: boolean; skipTables?: boolean } = {}): string {
  // WHY: Emojis cause Microsoft Edge TTS service to fail or produce unexpected audio output, 
  //      breaking the user experience for applications that process user-generated content.
  // HOW: Use emoji-regex library to identify and remove all Unicode emoji characters, then
  //      remove markdown formatting and control characters, ensuring clean text reaches the TTS service.
  // WHAT: Strips emojis, markdown formatting, and problematic control characters while preserving essential formatting.
  // LINKS: tests/emoji-handling.test.js; PR #emoji-handling; Microsoft Edge TTS compatibility requirements
  let cleanText = text.replace(emojiRegex(), '');
  
  // Process tables FIRST, before removing other markdown characters
  if (options.linearizeTables || options.skipTables) {
    cleanText = processTablesForTTS(cleanText, {
      linearizeTables: options.linearizeTables,
      skipTables: options.skipTables
    });
  }
  
  // Remove markdown formatting characters that can break TTS processing
  // Keep + and - signs as they're important for natural speech (e.g., "+20%", "-10%")
  const markdownChars = "*/()[]{}$%^@#=|\\~`><\"&";
  for (const char of markdownChars) {
    cleanText = cleanText.replace(new RegExp('\\' + char, 'g'), '');
  }
  
  // Remove control characters (U+0000 to U+001F except \t, \n, \r) and replace with space
  // eslint-disable-next-line no-control-regex
  return cleanText.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
}

/**
 * Generates a unique connection ID for WebSocket connections.
 * @returns UUID string with hyphens removed
 */
export function connectId(): string {
  return uuidv4().replace(/-/g, '');
}

function _findLastNewlineOrSpaceWithinLimit(text: Buffer, limit: number): number {
  const slice = text.subarray(0, limit);
  let splitAt = slice.lastIndexOf('\n');
  if (splitAt < 0) {
    splitAt = slice.lastIndexOf(' ');
  }
  return splitAt;
}

function _findSafeUtf8SplitPoint(textSegment: Buffer): number {
  let splitAt = textSegment.length;
  while (splitAt > 0) {
    const slice = textSegment.subarray(0, splitAt);
    // check if the slice is a valid utf8 string
    if (slice.toString('utf-8').endsWith('�')) {
      splitAt--;
      continue;
    }
    return splitAt;
  }
  return splitAt;
}

function _adjustSplitPointForXmlEntity(text: Buffer, splitAt: number): number {
  let ampersandIndex = text.lastIndexOf('&', splitAt - 1);
  while (ampersandIndex !== -1) {
    const semicolonIndex = text.indexOf(';', ampersandIndex);
    if (semicolonIndex !== -1 && semicolonIndex < splitAt) {
      break; // Found a terminated entity
    }
    // Ampersand is not terminated before split_at
    splitAt = ampersandIndex;
    ampersandIndex = text.lastIndexOf('&', splitAt - 1);
  }
  return splitAt;
}

/**
 * Splits text into chunks that don't exceed the specified byte length.
 * Attempts to split at word boundaries and handles UTF-8 encoding properly.
 * @param text - Text to split (string or Buffer)
 * @param byteLength - Maximum byte length per chunk
 * @yields Buffer chunks of the split text
 * @throws {ValueError} If byteLength is too small or text has invalid structure
 */
export function* splitTextByByteLength(text: string | Buffer, byteLength: number): Generator<Buffer> {
  let buffer = Buffer.isBuffer(text) ? text : Buffer.from(text, 'utf-8');

  if (byteLength <= 0) {
    throw new ValueError("byteLength must be greater than 0");
  }

  while (buffer.length > byteLength) {
    let splitAt = _findLastNewlineOrSpaceWithinLimit(buffer, byteLength);

    if (splitAt < 0) {
      splitAt = _findSafeUtf8SplitPoint(buffer.subarray(0, byteLength));
    }

    splitAt = _adjustSplitPointForXmlEntity(buffer, splitAt);

    if (splitAt <= 0) {
      throw new ValueError(
        "Maximum byte length is too small or "
        + "invalid text structure near '&' or invalid UTF-8"
      );
    }

    const chunk = buffer.subarray(0, splitAt);
    const chunkString = chunk.toString('utf-8').trim();
    if (chunkString) {
      yield Buffer.from(chunkString, 'utf-8');
    }

    buffer = buffer.subarray(splitAt);
  }

  const remainingChunk = buffer.toString('utf-8').trim();
  if (remainingChunk) {
    yield Buffer.from(remainingChunk, 'utf-8');
  }
}

/**
 * Creates SSML (Speech Synthesis Markup Language) from text and TTS configuration.
 * @param tc - TTS configuration containing voice and prosody settings
 * @param escapedText - Text content (should be XML-escaped)
 * @returns Complete SSML document string
 */
export function mkssml(tc: TTSConfig, escapedText: string | Buffer): string {
  const text = Buffer.isBuffer(escapedText) ? escapedText.toString('utf-8') : escapedText;
  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
    + `<voice name='${tc.voice}'>`
    + `<prosody pitch='${tc.pitch}' rate='${tc.rate}' volume='${tc.volume}'>`
    + `${text}`
    + "</prosody>"
    + "</voice>"
    + "</speak>"
  );
}

/**
 * Formats the current date as a string in the format expected by the TTS service.
 * @returns Formatted date string
 */
export function dateToString(): string {
  return new Date().toUTCString().replace("GMT", "GMT+0000 (Coordinated Universal Time)");
}

/**
 * Creates a complete WebSocket message with headers and SSML data.
 * @param requestId - Unique request identifier
 * @param timestamp - Timestamp string for the request
 * @param ssml - SSML content to include in the message
 * @returns Complete WebSocket message string with headers and data
 */
export function ssmlHeadersPlusData(requestId: string, timestamp: string, ssml: string): string {
  return (
    `X-RequestId:${requestId}\r\n`
    + "Content-Type:application/ssml+xml\r\n"
    + `X-Timestamp:${timestamp}Z\r\n`  // This is not a mistake, Microsoft Edge bug.
    + "Path:ssml\r\n\r\n"
    + `${ssml}`
  );
}

/**
 * Calculates the maximum message size for text chunks based on WebSocket limits.
 * @param ttsConfig - TTS configuration to calculate overhead for
 * @returns Maximum byte size for text content in a single message
 */
export function calcMaxMesgSize(ttsConfig: TTSConfig): number {
  const websocketMaxSize = 2 ** 16;
  const overheadPerMessage = ssmlHeadersPlusData(
    connectId(),
    dateToString(),
    mkssml(ttsConfig, ""),
  ).length + 50; // margin of error
  return websocketMaxSize - overheadPerMessage;
}


export { escape };

/**
 * Unescapes XML entities in text.
 * @param text - Text containing XML entities to unescape
 * @returns Text with XML entities converted back to their original characters
 */
export function unescape(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/**
 * Processes markdown tables in text with comprehensive options for TTS optimization.
 * @param text - Input text that may contain markdown tables
 * @param options - Processing options for table handling
 * @returns Text with tables processed according to options
 */
export function processTablesForTTS(text: string, options: { skipTables?: boolean; linearizeTables?: boolean } = {}): string {
  // WHY: Markdown tables are difficult for TTS engines to interpret naturally, 
  //      requiring flexible conversion options for different use cases.
  // HOW: Use multiple regex patterns to detect various table formats and apply
  //      appropriate processing based on user preferences.
  // WHAT: Converts tabular data with options to skip, linearize, or summarize tables.
  // LINKS: Adapted from mind-ui project; PR #table-linearization; TTS accessibility requirements
  
  // HANDLE TABLES FIRST - Convert to readable format, linearize, or skip entirely
  let processedText = text.replace(/(\|.*\|[\r\n]+)+/g, (match) => {
    // If skipTables is enabled, completely remove tables
    if (options.skipTables) {
      return ' [Table content skipped for TTS clarity]. ';
    }
    
    // If linearizeTables is enabled, convert to natural speech format
    if (options.linearizeTables) {
      return linearizeTableToSSML(match);
    }
    
    // Split table into lines
    const lines = match.trim().split('\n').filter(line => line.trim());
    
    // If it's a simple table with just separators, skip it entirely
    if (lines.every(line => /^[\s\-\|:]+$/.test(line))) {
      return ' [Table data omitted for clarity]. ';
    }
    
    // If it's a proper table with content, convert to readable format
    if (lines.length >= 2) {
      const headerRow = lines[0];
      const separatorRow = lines[1];
      const dataRows = lines.slice(2);
      
      // Extract headers (remove | and clean up)
      const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
      
      // If we have valid headers and data, create a readable summary
      if (headers.length > 0 && dataRows.length > 0) {
        let tableSummary = `Table with ${headers.length} columns: ${headers.join(', ')}. `;
        
        // Add a few sample data points if available
        if (dataRows.length > 0) {
          const firstDataRow = dataRows[0].split('|').map(cell => cell.trim()).filter(cell => cell);
          if (firstDataRow.length > 0) {
            tableSummary += `Sample data includes: ${firstDataRow.slice(0, Math.min(3, firstDataRow.length)).join(', ')}. `;
          }
        }
        
        // If there are more rows, mention the count
        if (dataRows.length > 1) {
          tableSummary += `Total of ${dataRows.length} data rows. `;
        }
        
        return tableSummary;
      }
    }
    
    // Fallback: just mention there's a table
    return ' [Table content present]. ';
  });
  
  // Additional table detection patterns to catch edge cases
  // Handle tables that might not start with | but contain table-like structure
  processedText = processedText.replace(/(?:^|\n)([^\n|]*\|[^\n]*\|[^\n]*)(?:\n|$)/gm, (match, content) => {
    if (options.skipTables) {
      return '\n[Table row skipped for TTS clarity].\n';
    }
    if (options.linearizeTables) {
      return '\n' + linearizeTableToSSML(match) + '\n';
    }
    return '\n[Table row: ' + content.replace(/\|/g, ' | ') + '].\n';
  });
  
  // Handle potential table separators that might be standalone
  // Only match lines that look like actual table separators (e.g., |---|---| or |:---|:---|)
  processedText = processedText.replace(/(?:^|\n)([\s]*\|[\s]*[-:]+[\s]*\|[\s]*[-:]+[\s]*\|[\s]*[-:]*[\s]*)(?:\n|$)/gm, (match, content) => {
    if (options.skipTables) {
      return '\n[Table separator skipped].\n';
    }
    return '\n[Table separator].\n';
  });
  
  return processedText;
}

/**
 * Linearize markdown tables into natural speech format for better TTS reading
 * Converts table structure into clear header-value narration with natural pauses and emphasis
 */
export function linearizeTableToSSML(markdownTable: string): string {
  // WHY: Tables need to be converted to natural speech for TTS accessibility,
  //      providing clear header-value narration with appropriate pauses.
  // HOW: Parse table structure, extract headers and data rows, then construct
  //      natural language output with pauses between cells and emphasis for important columns.
  // WHAT: Creates speech-friendly table narration with header-value pairs and natural pauses.
  // LINKS: Adapted from mind-ui/lib/ssmlUtils.ts; PR #table-linearization; TTS accessibility standards
  
  // Split table into lines and filter out empty lines
  const lines = markdownTable.trim().split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return '[Table content].';
  }
  
  // Extract headers from first row
  const headerRow = lines[0];
  const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
  
  if (headers.length === 0) {
    return '[Table content].';
  }
  
  // Skip separator row (second row with dashes and colons)
  const dataRows = lines.slice(2);
  
  if (dataRows.length === 0) {
    return `Table with columns: ${headers.join(', ')}. No data rows.`;
  }
  
  // Generate caption/summary
  let output = `Table with ${headers.length} columns: ${headers.join(', ')}. `;
  output += `Contains ${dataRows.length} data rows. `;
  
  // Process each data row
  dataRows.forEach((row, index) => {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
    
    if (cells.length > 0) {
      // Add extra breathing room before each row (except the first one)
      if (index > 0) {
        output += '... ';
      }
      
      // Create header-value pairs for each cell
      headers.forEach((header, headerIndex) => {
        const value = cells[headerIndex] || 'none';
        const cleanValue = value.replace(/[<>]/g, ''); // Remove any HTML-like tags
        
        // Add emphasis for the Emphasis column if it exists
        if (header.toLowerCase().includes('emphasis') || header.toLowerCase().includes('priority')) {
          output += `${header}: ${cleanValue}. `;
        } else {
          output += `${header}: ${cleanValue}. `;
        }
        
        // Add natural pause after every column value
        output += '... ';
      });
      
      // Add longer pause between rows (except for the last one)
      if (index < dataRows.length - 1) {
        output += '... ... ... ';
      }
    }
  });
  
  return output.trim();
}
