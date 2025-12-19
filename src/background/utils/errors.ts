export class ServiceWorkerError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class HttpError extends ServiceWorkerError {}

export class FeedParseError extends ServiceWorkerError {}

export class FeedUpdateError extends ServiceWorkerError {}

export class TransactionError extends ServiceWorkerError {}

export class NotFoundError extends ServiceWorkerError {}

export class FeedDeletionError extends ServiceWorkerError {}

export function getErrorMsg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  defaultMsg = "An unexpected error occurred, please try again.",
) {
  console.error("service-worker-error:", err);
  return err instanceof ServiceWorkerError ? err.message : defaultMsg;
}
