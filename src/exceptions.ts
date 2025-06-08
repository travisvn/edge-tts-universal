export class EdgeTTSException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EdgeTTSException";
  }
}

export class SkewAdjustmentError extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "SkewAdjustmentError";
  }
}

export class UnknownResponse extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "UnknownResponse";
  }
}

export class UnexpectedResponse extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "UnexpectedResponse";
  }
}

export class NoAudioReceived extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "NoAudioReceived";
  }
}

export class WebSocketError extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "WebSocketError";
  }
}

export class ValueError extends EdgeTTSException {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
} 