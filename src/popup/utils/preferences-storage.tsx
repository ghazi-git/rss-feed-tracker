import { createContext, FlowProps, onMount, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const PreferencesContext = createContext<PreferencesContextType>();

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferencesContext: cannot find a PreferencesContext");
  }

  return context;
}

export function PreferencesProvider(props: FlowProps) {
  const [store, setStore] = createStore<StoredPreferences>({
    ...DEFAULT_PREFERENCES,
  });
  onMount(async () => {
    const preferences = await loadPreferences();
    setStore(preferences);
  });

  const setDefaultFeedUpdateFrequency = (value: number) => {
    setStore("defaultFeedUpdateFrequency", value);
    savePreferences(store);
  };
  const setMarkNewPostsUnread = (value: boolean) => {
    setStore("markNewPostsUnread", value);
    savePreferences(store);
  };
  const setClickPostToToggleUnread = (value: boolean) => {
    setStore("clickPostToToggleUnread", value);
    savePreferences(store);
  };

  return (
    <PreferencesContext.Provider
      value={{
        store,
        setDefaultFeedUpdateFrequency,
        setMarkNewPostsUnread,
        setClickPostToToggleUnread,
      }}
    >
      {props.children}
    </PreferencesContext.Provider>
  );
}

async function savePreferences(value: StoredPreferences) {
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

const DEFAULT_PREFERENCES = {
  defaultFeedUpdateFrequency: 2 * 60 * 60 * 1000,
  markNewPostsUnread: true,
  clickPostToToggleUnread: false,
};

interface PreferencesContextType {
  store: StoredPreferences;
  setDefaultFeedUpdateFrequency: (value: number) => void;
  setMarkNewPostsUnread: (value: boolean) => void;
  setClickPostToToggleUnread: (value: boolean) => void;
}

interface StoredPreferences {
  defaultFeedUpdateFrequency: number;
  markNewPostsUnread: boolean;
  clickPostToToggleUnread: boolean;
}
