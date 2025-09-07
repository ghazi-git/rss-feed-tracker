import { Route, Router, useNavigate } from "@solidjs/router";
import { Toaster, ToastProvider } from "solid-notifications";

import Body from "@/popup/components/Body.jsx";
import Header from "@/popup/components/Header.jsx";
import LinkPreview from "@/popup/components/LinkPreview.jsx";
import AddFeed from "@/popup/pages/add-feed/index.jsx";
import EditFolder from "@/popup/pages/add-folder/EditFolder.jsx";
import AddFolder from "@/popup/pages/add-folder/index.jsx";
import Bookmarks from "@/popup/pages/Bookmarks.jsx";
import ImportFeeds from "@/popup/pages/import-feeds/index.jsx";
import NoFeedsYet from "@/popup/pages/no-feeds-yet/index.jsx";
import Node from "@/popup/pages/node/index.jsx";
import NodePosts from "@/popup/pages/node-posts/index.jsx";
import Preferences from "@/popup/pages/Preferences.jsx";
import { NODES } from "@/popup/utils/dummy-data.js";

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
          path="/home"
          component={() => {
            const navigate = useNavigate();
            const rootNode = NODES.find((node) => node.parentId === null);
            if (!rootNode) {
              // todo create a new one then redirect to the no feeds yet page
              navigate("/no-feeds-yet", { replace: true });
            } else {
              const rootNodeChildren = NODES.filter(
                (node) => node.parentId === rootNode.id,
              );
              if (rootNodeChildren.length === 0) {
                navigate("/no-feeds-yet", { replace: true });
              } else {
                navigate(`/home/nodes/${rootNode.id}`, { replace: true });
              }
            }
          }}
        />
        <Route path="/home/nodes/:id" component={Node} />
        <Route path="/home/nodes/:id/posts" component={NodePosts} />
        <Route path="/no-feeds-yet" component={NoFeedsYet} />
        <Route path="/add-feed" component={AddFeed} />
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
              navigate("/home", { replace: true });
            } else {
              navigate("/no-feeds-yet", { replace: true });
            }
          }}
        />
      </Router>
    </ToastProvider>
  );
}

export default App;
