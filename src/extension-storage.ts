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

export const DEFAULT_PREFERENCES = {
  defaultFeedUpdateFrequency: 2 * 60 * 60 * 1000,
  markNewPostsUnread: true,
  clickPostToToggleUnread: false,
};

export interface PreferencesContextType {
  store: StoredPreferences;
  setDefaultFeedUpdateFrequency: (value: number) => void;
  setMarkNewPostsUnread: (value: boolean) => void;
  setClickPostToToggleUnread: (value: boolean) => void;
}

export interface StoredPreferences {
  defaultFeedUpdateFrequency: number;
  markNewPostsUnread: boolean;
  clickPostToToggleUnread: boolean;
}
