import { generateOpml } from "feedsmith";
import type { Opml } from "feedsmith/types";

import { getDBConnection, TreeNode } from "@/db-setup";
import { OPMLExportError } from "@/offscreen/errors";
import { triggerFileDownload } from "@/offscreen/utils";
import { getAll, getObject } from "@/utils/idb-helpers";

export async function exportOPML(folder: number) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"]);
  const parentFolder = await getObject(tx, "nodes", folder);
  if (!parentFolder || parentFolder.type !== "folder") {
    throw new OPMLExportError(
      "Unable to find the folder, it may have been deleted.",
    );
  }

  const nodes = await getAll(tx, "nodes");
  const outlines = getOutlineTree(folder, nodes);
  if (!outlines.length) {
    throw new OPMLExportError("There are no feeds to export.");
  }

  const fileContent = generateOpml({
    head: { title: "RSS Feed Tracker - Feeds Export", dateCreated: new Date() },
    body: { outlines: getOPMLOutlines(outlines) },
  });

  const filename = `feeds_export_${new Date().toISOString()}.opml`;
  const file = new Blob([fileContent], { type: "application/xml" });
  triggerFileDownload(filename, file);
}

function getOutlineTree(parentId: number, nodes: TreeNode[]) {
  const outlines: OutlineElement[] = [];
  const childNodes = nodes.filter((n) => n.parentId === parentId);
  for (const child of childNodes) {
    if (child.type === "folder") {
      const children = getOutlineTree(child.id, nodes);
      // export folders with feeds only
      if (children.length) {
        outlines.push({ type: "folder", name: child.name, children });
      }
    } else {
      outlines.push({ type: "feed", name: child.name, url: child.feed.url });
    }
  }

  return outlines;
}

function getOPMLOutlines(outlines: OutlineElement[]) {
  const opmlOutlines: Opml.Outline<Date>[] = [];
  for (const outline of outlines) {
    if (outline.type === "folder") {
      const childOutlines = getOPMLOutlines(outline.children);
      opmlOutlines.push({ text: outline.name, outlines: childOutlines });
    } else {
      opmlOutlines.push({
        text: outline.name,
        type: "rss",
        xmlUrl: outline.url,
      });
    }
  }

  return opmlOutlines;
}

interface FeedOutline {
  type: "feed";
  name: string;
  url: string;
}
interface FolderOutline {
  type: "folder";
  name: string;
  children: OutlineElement[];
}
export type OutlineElement = FolderOutline | FeedOutline;
