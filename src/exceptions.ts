/**
 * Base exception class for all Edge TTS related errors.
 */
export class EdgeTTSException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EdgeTTSException";
  }
}

/**
 * Exception raised when there's an error adjusting clock skew for API requests.
 * This typically occurs when the client and server clocks are significantly out of sync.
 */
export class SkewAdjustmentError extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "SkewAdjustmentError";
  }
}

/**
 * Exception raised when an unknown response is received from the TTS service.
 * This indicates an unexpected message type or format that the client cannot handle.
 */
export class UnknownResponse extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "UnknownResponse";
  }
}

/**
 * Exception raised when an unexpected response is received from the TTS service.
 * This indicates a response that doesn't match the expected protocol flow.
 */
export class UnexpectedResponse extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "UnexpectedResponse";
  }
}

/**
 * Exception raised when no audio data is received during synthesis.
 * This typically indicates a problem with the synthesis request or service.
 */
export class NoAudioReceived extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "NoAudioReceived";
  }
}

/**
 * Exception raised when there's an error with the WebSocket connection.
 * This can occur during connection establishment, data transmission, or connection closure.
 */
export class WebSocketError extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "WebSocketError";
  }
}

/**
 * Exception raised when an invalid value is provided to a function or method.
 * This is typically used for input validation errors.
 */
export class ValueError extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
} 