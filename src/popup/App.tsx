import { Navigate, Route, Router } from "@solidjs/router";
import { onMount, ParentComponent } from "solid-js";
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
import NoFeedsYet from "@/popup/pages/no-feeds-yet";
import Node from "@/popup/pages/node/index.jsx";
import NodePosts from "@/popup/pages/node-posts";
import Preferences from "@/popup/pages/Preferences";
import { NODES } from "@/popup/utils/dummy-data.js";
import {
  detectSystemTheme,
  enableTheme,
  uiTheme,
} from "@/popup/utils/ui-theme";

const Layout: ParentComponent = (props) => {
  return (
    <>
      <Header />
      <Body>{props.children}</Body>
      <LinkPreview />
    </>
  );
};

function App() {
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
    <ToastProvider
      limit={1}
      positionX="center"
      positionY="bottom"
      showProgressBar={false}
      dismissButtonStyle={{ "box-shadow": "none" }}
    >
      <Toaster />
      <Router root={Layout}>
        <Route
          path="/library"
          component={() => {
            const rootNode = NODES.find((node) => node.parentId === null);
            if (!rootNode) {
              // todo create a new one then redirect to the no feeds yet page
              return <Navigate href="/library/no-feeds-yet" />;
            } else {
              const rootNodeChildren = NODES.filter(
                (node) => node.parentId === rootNode.id,
              );
              if (rootNodeChildren.length === 0) {
                return <Navigate href="/library/no-feeds-yet" />;
              } else {
                return <Navigate href={`/library/nodes/${rootNode.id}`} />;
              }
            }
          }}
        />
        <Route path="/library/nodes/:id" component={Node} />
        <Route path="/library/nodes/:id/posts" component={NodePosts} />
        <Route path="/library/no-feeds-yet" component={NoFeedsYet} />
        <Route path="/library/feeds/add" component={AddFeed} />
        <Route path="/library/feeds/import" component={ImportFeeds} />
        <Route path="/library/feeds/:id/edit" component={EditFeed} />
        <Route path="/library/folders/add" component={AddFolder} />
        <Route path="/library/folders/:id/edit" component={EditFolder} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/preferences" component={Preferences} />
        <Route
          path="*"
          component={() => {
            const hasFeeds = window.localStorage.getItem("hasFeeds");
            if (hasFeeds) {
              return <Navigate href="/library" />;
            } else {
              return <Navigate href="/library/no-feeds-yet" />;
            }
          }}
        />
      </Router>
    </ToastProvider>
  );
}

export default App;
