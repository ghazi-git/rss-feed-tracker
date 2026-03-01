import { POPUP_STATE_PORT } from "@/utils/settings";

chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name !== POPUP_STATE_PORT) return;

  await savePopupState("open");
  port.onDisconnect.addListener(async () => {
    await savePopupState("closed");
  });
});

chrome.runtime.onStartup.addListener(async () => {
  // set the popup state to closed on extension startup. This ensures the popup
  // state is correct even when chrome crashes while the popup is open
  await savePopupState("closed");
});

async function savePopupState(popupState: "open" | "closed") {
  await chrome.storage.local.set({ popupState });
}

export async function getPopupState() {
  const { popupState } = await chrome.storage.local.get("popupState");
  return popupState === "open" ? "open" : "closed";
}
