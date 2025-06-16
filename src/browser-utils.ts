/**
 * Browser-specific utility functions that avoid Node.js dependencies.
 * Provides browser-native implementations of UUID generation and XML escaping.
 */

/**
 * Generates a UUID v4 string without hyphens using browser's crypto API.
 * @returns UUID string with hyphens removed
 */
export function browserConnectId(): string {
  // Use crypto.getRandomValues for browser-native UUID generation
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Set version (4) and variant bits according to RFC 4122
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;

  // Convert to hex string and format as UUID, then remove hyphens
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;

  return uuid.replace(/-/g, '');
}

/**
 * Browser-native XML escaping function.
 * @param text - Text to escape
 * @returns XML-escaped text
 */
export function browserEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unescapes XML entities in text.
 * @param text - Text containing XML entities to unescape
 * @returns Text with XML entities converted back to their original characters
 */
export function browserUnescape(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // Do &amp; last to avoid double unescaping
}

/**
 * Removes control characters that are incompatible with TTS processing.
 * @param text - Input text to clean
 * @returns Text with control characters replaced by spaces
 */
export function browserRemoveIncompatibleCharacters(text: string): string {
  // Remove control characters (U+0000 to U+001F except \t, \n, \r)
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
}

/**
 * Formats the current date as a string in the format expected by the TTS service.
 * @returns Formatted date string
 */
export function browserDateToString(): string {
  return new Date().toUTCString().replace("GMT", "GMT+0000 (Coordinated Universal Time)");
}

/**
 * Creates SSML (Speech Synthesis Markup Language) from text and voice configuration.
 * @param voice - Voice name
 * @param rate - Speech rate (e.g., "+0%")
 * @param volume - Speech volume (e.g., "+0%") 
 * @param pitch - Speech pitch (e.g., "+0Hz")
 * @param escapedText - Text content (should be XML-escaped)
 * @returns Complete SSML document string
 */
export function browserMkssml(voice: string, rate: string, volume: string, pitch: string, escapedText: string): string {
  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
    + `<voice name='${voice}'>`
    + `<prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>`
    + `${escapedText}`
    + "</prosody>"
    + "</voice>"
    + "</speak>"
  );
}

/**
 * Creates a complete WebSocket message with headers and SSML data.
 * @param requestId - Unique request identifier
 * @param timestamp - Timestamp string for the request
 * @param ssml - SSML content to include in the message
 * @returns Complete WebSocket message string with headers and data
 */
export function browserSsmlHeadersPlusData(requestId: string, timestamp: string, ssml: string): string {
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
 * @param voice - Voice name
 * @param rate - Speech rate
 * @param volume - Speech volume
 * @param pitch - Speech pitch
 * @returns Maximum byte size for text content in a single message
 */
export function browserCalcMaxMesgSize(voice: string, rate: string, volume: string, pitch: string): number {
  const websocketMaxSize = 2 ** 16;
  const overheadPerMessage = browserSsmlHeadersPlusData(
    browserConnectId(),
    browserDateToString(),
    browserMkssml(voice, rate, volume, pitch, ""),
  ).length + 50; // margin of error
  return websocketMaxSize - overheadPerMessage;
} 