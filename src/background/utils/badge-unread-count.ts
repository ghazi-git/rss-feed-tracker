import { ReadTX, ReadWriteTX } from "@/db-setup";
import { getAllFromIndex } from "@/idb-helpers";

export async function setUnreadCountOnExtensionBadge(count: number) {
  if (count > 0) {
    const text = count > 1000 ? "+1k" : count === 1000 ? "1k" : `${count}`;
    await chrome.action.setBadgeText({ text });
  } else {
    await chrome.action.setBadgeText({ text: "" });
  }
}

export async function getRootFolderUnreadCount(tx: ReadTX | ReadWriteTX) {
  const nodes = await getAllFromIndex(tx, "nodes", "by_type", {
    query: "folder",
  });
  const rootFolder = nodes
    .filter((f) => f.type === "folder")
    .find((f) => f.parentId === null);

  return rootFolder?.unreadCount;
}
