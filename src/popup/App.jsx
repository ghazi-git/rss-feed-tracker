import { Route, Router, useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";
import { Toaster, ToastProvider } from "solid-notifications";

import Body from "@/popup/components/Body.jsx";
import Header from "@/popup/components/Header.jsx";
import LinkPreview from "@/popup/components/LinkPreview.jsx";
import AddFeed from "@/popup/pages/add-edit-feed/AddFeed.jsx";
import EditFeed from "@/popup/pages/add-edit-feed/EditFeed.jsx";
import AddFolder from "@/popup/pages/add-edit-folder/AddFolder.jsx";
import EditFolder from "@/popup/pages/add-edit-folder/EditFolder.jsx";
import Bookmarks from "@/popup/pages/Bookmarks.jsx";
import ImportFeeds from "@/popup/pages/import-feeds/index.jsx";
import NoFeedsYet from "@/popup/pages/no-feeds-yet/index.jsx";
import Node from "@/popup/pages/node/index.jsx";
import NodePosts from "@/popup/pages/node-posts/index.jsx";
import Preferences from "@/popup/pages/Preferences.jsx";
import { NODES } from "@/popup/utils/dummy-data.js";
import {
  detectSystemTheme,
  enableTheme,
  uiTheme,
} from "@/popup/utils/ui-theme.jsx";

function Layout(props) {
  return (
    <>
      <Header />
      <Body>{props.children}</Body>
      <LinkPreview />
    </>
  );
}

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
            const navigate = useNavigate();
            const rootNode = NODES.find((node) => node.parentId === null);
            if (!rootNode) {
              // todo create a new one then redirect to the no feeds yet page
              navigate("/library/no-feeds-yet", { replace: true });
            } else {
              const rootNodeChildren = NODES.filter(
                (node) => node.parentId === rootNode.id,
              );
              if (rootNodeChildren.length === 0) {
                navigate("/library/no-feeds-yet", { replace: true });
              } else {
                navigate(`/library/nodes/${rootNode.id}`, { replace: true });
              }
            }
          }}
        />
        <Route path="/library/nodes/:id" component={Node} />
        <Route path="/library/nodes/:id/posts" component={NodePosts} />
        <Route path="/library/no-feeds-yet" component={NoFeedsYet} />
        <Route path="/add-feed" component={AddFeed} />
        <Route path="/feeds/:id" component={EditFeed} />
        <Route path="/add-folder" component={AddFolder} />
        <Route path="/folders/:id" component={EditFolder} />
        <Route path="/import-feeds" component={ImportFeeds} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/preferences" component={Preferences} />
        <Route
          path="*"
          component={() => {
            const navigate = useNavigate();
            const hasFeeds = window.localStorage.getItem("hasFeeds");
            if (hasFeeds) {
              navigate("/library", { replace: true });
            } else {
              navigate("/library/no-feeds-yet", { replace: true });
            }
          }}
        />
      </Router>
    </ToastProvider>
  );
}

export default App;
