import { sendMessage } from "@/messaging-wrapper";

export function triggerFileDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function isPopupOpen() {
  const resp = await sendMessage("search-index/is-popup-open", undefined);
  return resp.success && resp.data;
}
