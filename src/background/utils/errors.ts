export class HttpError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HttpError";
  }
}

export class FeedParseError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FeedParseError";
  }
}

export class FeedCreationError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FeedCreationError";
  }
}

export class TransactionError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TransactionError";
  }
}
