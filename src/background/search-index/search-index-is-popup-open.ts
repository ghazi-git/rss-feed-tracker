import { getPopupState } from "@/background/popup-state";

export async function isExtensionPopupOpen() {
  const popupState = await getPopupState();
  return popupState === "open";
}
