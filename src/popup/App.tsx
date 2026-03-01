import { Navigate, Route, Router } from "@solidjs/router";
import { createEffect, onMount, ParentComponent } from "solid-js";
import { Toaster, ToastProvider } from "solid-notifications";

import Body from "@/popup/components/Body";
import Header from "@/popup/components/Header";
import LinkPreview from "@/popup/components/LinkPreview";
import AddFeed from "@/popup/pages/add-edit-feed/AddFeed";
import EditFeed from "@/popup/pages/add-edit-feed/EditFeed";
import SelectFeed from "@/popup/pages/add-edit-feed/SelectFeed";
import AddFolder from "@/popup/pages/add-edit-folder/AddFolder";
import EditFolder from "@/popup/pages/add-edit-folder/EditFolder";
import Bookmarks from "@/popup/pages/bookmarks";
import ImportFeeds from "@/popup/pages/import-feeds";
import Library from "@/popup/pages/Library";
import NoFeedsYet from "@/popup/pages/no-feeds-yet";
import Node from "@/popup/pages/node";
import NodePosts from "@/popup/pages/node-posts";
import NotFound from "@/popup/pages/NotFound";
import Preferences from "@/popup/pages/preferences";
import SearchPage from "@/popup/pages/search";
import {
  getLastVisitedPage,
  saveLastVisitedPage,
  useCurrentURL,
} from "@/popup/utils/last-visited-page";
import { PreferencesProvider } from "@/popup/utils/preferences-context";
import {
  detectSystemTheme,
  enableTheme,
  uiTheme,
} from "@/popup/utils/ui-theme";
import { POPUP_STATE_PORT } from "@/utils/settings";

function App() {
  // get last visited page on app start to avoid losing on navigation
  let lastVisited = getLastVisitedPage();
  const theme = uiTheme() ?? detectSystemTheme();
  enableTheme(theme);
  onMount(() => {
    chrome.runtime.connect({ name: POPUP_STATE_PORT });
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches: isDark }) => {
        if (!uiTheme()) {
          const systemTheme = isDark ? "dark" : "light";
          enableTheme(systemTheme);
        }
      });
  });

  return (
    <PreferencesProvider>
      <ToastProvider
        limit={1}
        positionX="center"
        positionY="bottom"
        showProgressBar={false}
        dismissButtonStyle={{ "box-shadow": "none" }}
      >
        <Toaster />
        <Router root={Layout}>
          <Route path="/library" component={Library} />
          <Route path="/library/nodes/:id" component={Node} />
          <Route path="/library/nodes/:id/posts" component={NodePosts} />
          <Route path="/library/nodes/:id/search" component={SearchPage} />
          <Route path="/library/no-feeds-yet" component={NoFeedsYet} />
          <Route path="/library/feeds/select" component={SelectFeed} />
          <Route path="/library/feeds/add" component={AddFeed} />
          <Route path="/library/feeds/import" component={ImportFeeds} />
          <Route path="/library/feeds/:id/edit" component={EditFeed} />
          <Route path="/library/folders/add" component={AddFolder} />
          <Route path="/library/folders/:id/edit" component={EditFolder} />
          <Route path="/library/not-found" component={NotFound} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/preferences" component={Preferences} />
          <Route
            path="*"
            component={() => {
              if (lastVisited) {
                const { url, scrollPosition, postsCount } = lastVisited;
                lastVisited = null;
                return (
                  <Navigate
                    href={url}
                    state={{ url, scrollPosition, postsCount }}
                  />
                );
              }
              return <Navigate href="/library" />;
            }}
          />
        </Router>
      </ToastProvider>
    </PreferencesProvider>
  );
}

const Layout: ParentComponent = (props) => {
  const currentURL = useCurrentURL();
  createEffect(() => {
    saveLastVisitedPage(currentURL());
  });

  return (
    <>
      <Header />
      <Body>{props.children}</Body>
      <LinkPreview />
    </>
  );
};

export default App;
