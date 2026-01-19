import { createContext, FlowProps, onMount, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  StoredPreferences,
} from "@/utils/extension-storage";

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

  const setPreferences = async (value: Partial<StoredPreferences>) => {
    setStore((prev) => ({ ...prev, ...value }));
    await savePreferences(store);
  };

  return (
    <PreferencesContext.Provider value={{ preferences: store, setPreferences }}>
      {props.children}
    </PreferencesContext.Provider>
  );
}

interface PreferencesContextType {
  preferences: StoredPreferences;
  setPreferences: (value: Partial<StoredPreferences>) => Promise<void>;
}
