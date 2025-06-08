/**
 * Represents a chunk of data received during TTS streaming.
 * Can contain either audio data or word boundary metadata.
 */
export type TTSChunk = {
  /** The type of chunk - either audio data or word boundary metadata */
  type: "audio" | "WordBoundary";
  /** Raw audio data buffer (present for audio chunks) */
  data?: Buffer;
  /** Duration of the word in 100-nanosecond units (present for WordBoundary chunks) */
  duration?: number;
  /** Offset from the beginning in 100-nanosecond units (present for WordBoundary chunks) */
  offset?: number;
  /** The spoken text (present for WordBoundary chunks) */
  text?: string;
};

/**
 * Voice characteristics and personality tags from the Microsoft Edge TTS service.
 */
export type VoiceTag = {
  /** Content categories that the voice is optimized for */
  ContentCategories: (
    | "Cartoon"
    | "Conversation"
    | "Copilot"
    | "Dialect"
    | "General"
    | "News"
    | "Novel"
    | "Sports"
  )[];
  /** Personality traits that describe the voice's characteristics */
  VoicePersonalities: (
    | "Approachable"
    | "Authentic"
    | "Authority"
    | "Bright"
    | "Caring"
    | "Casual"
    | "Cheerful"
    | "Clear"
    | "Comfort"
    | "Confident"
    | "Considerate"
    | "Conversational"
    | "Cute"
    | "Expressive"
    | "Friendly"
    | "Honest"
    | "Humorous"
    | "Lively"
    | "Passion"
    | "Pleasant"
    | "Positive"
    | "Professional"
    | "Rational"
    | "Reliable"
    | "Sincere"
    | "Sunshine"
    | "Warm"
  )[];
};

/**
 * Complete voice definition as returned by the Microsoft Edge TTS service.
 */
export type Voice = {
  /** Full voice name identifier */
  Name: string;
  /** Short name for the voice */
  ShortName: string;
  /** Gender of the voice */
  Gender: "Female" | "Male";
  /** Locale code (e.g., "en-US", "zh-CN") */
  Locale: string;
  /** Recommended audio codec for this voice */
  SuggestedCodec: "audio-24khz-48kbitrate-mono-mp3";
  /** Human-readable friendly name */
  FriendlyName: string;
  /** Voice availability status */
  Status: "GA";
  /** Voice characteristics and personality traits */
  VoiceTag: VoiceTag;
};

/**
 * Extended voice type with language information for the VoicesManager.
 */
export type VoicesManagerVoice = Voice & {
  /** Language code extracted from the locale (e.g., "en" from "en-US") */
  Language: string;
};

/**
 * Filter criteria for finding voices using the VoicesManager.
 */
export type VoicesManagerFind = {
  /** Filter by voice gender */
  Gender?: "Female" | "Male";
  /** Filter by locale code */
  Locale?: string;
  /** Filter by language code */
  Language?: string;
}

/**
 * Internal state tracking for the Communicate class during streaming.
 */
export type CommunicateState = {
  /** Buffer for partial text data */
  partialText: Buffer;
  /** Timing offset compensation for multi-request scenarios */
  offsetCompensation: number;
  /** Last recorded duration offset for timing calculations */
  lastDurationOffset: number;
  /** Flag indicating if the stream method has been called */
  streamWasCalled: boolean;
}; 