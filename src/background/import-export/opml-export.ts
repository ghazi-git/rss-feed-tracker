import { generateOpml } from "feedsmith";
import type { Opml } from "feedsmith/types";

import { getDBConnection, TreeNode } from "@/background/db-setup";
import { OutlineElement } from "@/background/import-export/opml-import";
import { NotFoundError, OPMLExportError } from "@/background/utils/errors";
import { getAll, getObject } from "@/background/utils/idb-helpers";

export async function exportOPML(folder: number) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"]);
  const parentFolder = await getObject(tx, "nodes", folder);
  if (!parentFolder || parentFolder.type !== "folder") {
    throw new NotFoundError(
      "Unable to find the folder, it may have been deleted.",
    );
  }

  const nodes = await getAll(tx, "nodes");
  const outlines = getOutlineTree(folder, nodes);
  if (!outlines.length) {
    throw new OPMLExportError("There are no feeds to export in this folder.");
  }

  return generateOpml({
    head: { title: "RSS Feed Tracker - Feeds Export", dateCreated: new Date() },
    body: { outlines: getOPMLOutlines(outlines) },
  });
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
