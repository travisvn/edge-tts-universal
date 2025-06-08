export type TTSChunk = {
  type: "audio" | "WordBoundary";
  data?: Buffer;
  duration?: number;
  offset?: number;
  text?: string;
};

export type VoiceTag = {
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

export type Voice = {
  Name: string;
  ShortName: string;
  Gender: "Female" | "Male";
  Locale: string;
  SuggestedCodec: "audio-24khz-48kbitrate-mono-mp3";
  FriendlyName: string;
  Status: "GA";
  VoiceTag: VoiceTag;
};

export type VoicesManagerVoice = Voice & {
  Language: string;
};

export type VoicesManagerFind = {
  Gender?: "Female" | "Male";
  Locale?: string;
  Language?: string;
}

export type CommunicateState = {
  partialText: Buffer;
  offsetCompensation: number;
  lastDurationOffset: number;
  streamWasCalled: boolean;
}; 