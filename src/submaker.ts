import { TTSChunk } from "./types";
import { ValueError } from "./exceptions";

interface Cue {
  index: number;
  start: number; // in seconds
  end: number; // in seconds
  content: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Utility class for generating SRT subtitles from WordBoundary events.
 * 
 * @example
 * ```typescript
 * const subMaker = new SubMaker();
 * 
 * for await (const chunk of communicate.stream()) {
 *   if (chunk.type === 'WordBoundary') {
 *     subMaker.feed(chunk);
 *   }
 * }
 * 
 * const srt = subMaker.getSrt();
 * ```
 */
export class SubMaker {
  private cues: Cue[] = [];

  /**
   * Adds a WordBoundary chunk to the subtitle maker.
   * 
   * @param msg - Must be a WordBoundary type chunk with offset, duration, and text
   * @throws {ValueError} If chunk is not a WordBoundary with required fields
   */
  feed(msg: TTSChunk): void {
    if (msg.type !== 'WordBoundary' || msg.offset === undefined || msg.duration === undefined || msg.text === undefined) {
      throw new ValueError("Invalid message type, expected 'WordBoundary' with offset, duration and text");
    }

    // offset and duration are in 100-nanosecond intervals.
    // srt timestamps are in seconds. 1s = 10^7 * 100ns
    const start = msg.offset / 1e7;
    const end = (msg.offset + msg.duration) / 1e7;

    this.cues.push({
      index: this.cues.length + 1,
      start: start,
      end: end,
      content: msg.text,
    });
  }

  mergeCues(words: number): void {
    if (words <= 0) {
      throw new ValueError("Invalid number of words to merge, expected > 0");
    }
    if (this.cues.length === 0) {
      return;
    }

    const newCues: Cue[] = [];
    let currentCue: Cue = this.cues[0];

    for (const cue of this.cues.slice(1)) {
      if (currentCue.content.split(' ').length < words) {
        currentCue = {
          ...currentCue,
          end: cue.end,
          content: `${currentCue.content} ${cue.content}`,
        };
      } else {
        newCues.push(currentCue);
        currentCue = cue;
      }
    }
    newCues.push(currentCue);

    // re-index
    this.cues = newCues.map((cue, i) => ({ ...cue, index: i + 1 }));
  }

  /**
   * Returns the subtitles in SRT format.
   * 
   * @returns SRT formatted subtitles
   */
  getSrt(): string {
    return this.cues.map(cue => {
      return `${cue.index}\r\n${formatTime(cue.start)} --> ${formatTime(cue.end)}\r\n${cue.content}\r\n`;
    }).join('\r\n');
  }

  toString(): string {
    return this.getSrt();
  }
} 