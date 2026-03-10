import { glogger } from "@/utils/logging";

export class OffscreenError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class OPMLExportError extends OffscreenError {}

export class BackupError extends OffscreenError {}

export class RestoreError extends OffscreenError {}

export function getErrorMsg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  defaultMsg = "An unexpected error occurred, please try again.",
) {
  glogger.error("offscreen-document-error:", err);
  return err instanceof OffscreenError ? err.message : defaultMsg;
}
