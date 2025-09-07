import { NODES } from "@/popup/utils/dummy-data.js";

export function getParentOptions() {
  return NODES.filter((n) => n.type === "folder").map((n) => {
    if (n.parentId) {
      return { label: n.name, value: n.id };
    } else {
      return { label: `${n.name} (Top-level Folder)`, value: n.id };
    }
  });
}
