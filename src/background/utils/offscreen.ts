// code from https://developer.chrome.com/docs/extensions/reference/api/offscreen#maintain_the_lifecycle_of_an_offscreen_document
// with added explicit resource mgt (using)
let creating: Promise<void> | null = null; // A global promise to avoid concurrency issues
export async function setupOffscreenDocument(justification: string): Promise<{
  status: "created" | "already-created";
  [Symbol.asyncDispose](): Promise<void>;
}> {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const path = "src/offscreen/index.html";
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return {
      status: "already-created",
      async [Symbol.asyncDispose]() {
        await chrome.offscreen.closeDocument();
      },
    };
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ["BLOBS", "WORKERS"],
      justification,
    });
    await creating;
    creating = null;
  }

  return {
    status: "created",
    async [Symbol.asyncDispose]() {
      await chrome.offscreen.closeDocument();
    },
  };
}
