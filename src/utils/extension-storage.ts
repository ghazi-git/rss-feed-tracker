export async function savePreferences(value: StoredPreferences) {
  await chrome.storage.local.set({ preferences: value });
}

export async function loadPreferences(): Promise<StoredPreferences> {
  const value: { preferences: StoredPreferences } =
    await chrome.storage.local.get("preferences");

  try {
    return { ...DEFAULT_PREFERENCES, ...value.preferences };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  defaultFeedUpdateFrequency: 2 * 60 * 60 * 1000,
  clickPostToToggleUnread: false,
  orderPostsBy: "publishedAt",
  groupFolderPosts: true,
};

export interface StoredPreferences {
  defaultFeedUpdateFrequency: number | null;
  clickPostToToggleUnread: boolean;
  orderPostsBy: OrderPostsBy;
  groupFolderPosts: boolean;
}

export type OrderPostsBy = "publishedAt" | "receivedAt";
