import { v4 as uuidv4 } from 'uuid';
import { TTSConfig } from './tts_config';
import { ValueError } from "./exceptions";
import escape from 'xml-escape';

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
 * Removes control characters that are incompatible with TTS processing.
 * @param text - Input text to clean
 * @returns Text with control characters replaced by spaces
 */
export function removeIncompatibleCharacters(text: string): string {
  // Remove control characters (U+0000 to U+001F except \t, \n, \r)
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
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
  let buffer = Buffer.from(
    (Buffer.isBuffer(text) ? text.toString('utf-8') : text).trim(),
    'utf-8'
  );

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