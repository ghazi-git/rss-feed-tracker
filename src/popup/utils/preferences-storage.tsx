import { createContext, FlowProps, onMount, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  PreferencesContextType,
  savePreferences,
  StoredPreferences,
} from "@/extension-storage";

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
