import { v4 as uuidv4 } from 'uuid';
import { TTSConfig } from './tts_config';
import { ValueError } from "./exceptions";
import escape from 'xml-escape';

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

export function removeIncompatibleCharacters(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
}

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

    let chunk = buffer.subarray(0, splitAt);
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

export function dateToString(): string {
  return new Date().toUTCString().replace("GMT", "GMT+0000 (Coordinated Universal Time)");
}

export function ssmlHeadersPlusData(requestId: string, timestamp: string, ssml: string): string {
  return (
    `X-RequestId:${requestId}\r\n`
    + "Content-Type:application/ssml+xml\r\n"
    + `X-Timestamp:${timestamp}Z\r\n`  // This is not a mistake, Microsoft Edge bug.
    + "Path:ssml\r\n\r\n"
    + `${ssml}`
  );
}

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
export function unescape(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
} 