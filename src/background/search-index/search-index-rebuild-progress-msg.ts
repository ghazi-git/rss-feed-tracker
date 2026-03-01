import { getSearchIndexRebuildingProgress } from "@/background/utils/search";

export async function getRebuildingProgressMsg() {
  const progress = await getSearchIndexRebuildingProgress();
  if (progress) {
    const soFar = progress.postsIndexedSoFar;
    if (soFar === 0)
      return `
        Rebuilding the search index has been scheduled. Since the process
        can be resource-heavy depending on the number of posts already
        collected, it will start a while after the extension popup is closed.
      `;

    const total = progress.totalPostsToBeIndexed;
    if (total && total >= soFar) {
      const percent = Math.min((soFar * 100) / total, 100);
      return `
        Rebuilding the search index is in progress (${percent.toFixed(1)}%).
        Since the process can be resource-heavy depending on the number of posts
        stored, it will run only after the extension popup is closed.
      `;
    } else {
      return `
        Rebuilding the search index is in progress. Since the process
        can be resource-heavy depending on the number of posts already
        collected, it will run only after the extension popup is closed.
      `;
    }
  }

  return null;
}
