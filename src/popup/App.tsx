import { Navigate, Route, Router, useLocation } from "@solidjs/router";
import { createEffect, onMount, ParentComponent } from "solid-js";
import { Toaster, ToastProvider } from "solid-notifications";

import Body from "@/popup/components/Body";
import Header from "@/popup/components/Header";
import LinkPreview from "@/popup/components/LinkPreview";
import AddFeed from "@/popup/pages/add-edit-feed/AddFeed";
import EditFeed from "@/popup/pages/add-edit-feed/EditFeed";
import AddFolder from "@/popup/pages/add-edit-folder/AddFolder";
import EditFolder from "@/popup/pages/add-edit-folder/EditFolder";
import Bookmarks from "@/popup/pages/Bookmarks";
import ImportFeeds from "@/popup/pages/import-feeds";
import Library from "@/popup/pages/Library";
import NoFeedsYet from "@/popup/pages/no-feeds-yet";
import Node from "@/popup/pages/node";
import NodePosts from "@/popup/pages/node-posts";
import NotFound from "@/popup/pages/NotFound";
import Preferences from "@/popup/pages/Preferences";
import {
  getLastVisitedPage,
  saveLastVisitedPage,
} from "@/popup/utils/last-visited-page";
import { PreferencesProvider } from "@/popup/utils/preferences-storage";
import {
  detectSystemTheme,
  enableTheme,
  uiTheme,
} from "@/popup/utils/ui-theme";

const Layout: ParentComponent = (props) => {
  const location = useLocation();
  createEffect(() => {
    const currentURL = location.pathname + location.search + location.hash;
    if (!currentURL.endsWith(".html") && currentURL !== "/") {
      saveLastVisitedPage(currentURL);
    }
  });

  return (
    <>
      <Header />
      <Body>{props.children}</Body>
      <LinkPreview />
    </>
  );
};

function App() {
  let lastVisitedURL = getLastVisitedPage();
  const theme = uiTheme() ?? detectSystemTheme();
  enableTheme(theme);
  onMount(() => {
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
          <Route path="/library/no-feeds-yet" component={NoFeedsYet} />
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
              if (lastVisitedURL) {
                const redirectTo = lastVisitedURL;
                lastVisitedURL = null;
                return <Navigate href={redirectTo} />;
              }
              return <Navigate href="/library" />;
            }}
          />
        </Router>
      </ToastProvider>
    </PreferencesProvider>
  );
}

export default App;
