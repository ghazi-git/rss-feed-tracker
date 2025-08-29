import { Route, Router, useNavigate } from "@solidjs/router";
import { Toaster, ToastProvider } from "solid-notifications";

import Body from "@/popup/components/Body.jsx";
import Header from "@/popup/components/Header.jsx";
import AddFeed from "@/popup/pages/add-feed/index.jsx";
import AddFolder from "@/popup/pages/add-folder/index.jsx";
import ImportFeeds from "@/popup/pages/import-feeds/index.jsx";
import NoFeedsYet from "@/popup/pages/no-feeds-yet/index.jsx";
import Node from "@/popup/pages/node/index.jsx";
import Settings from "@/popup/pages/Settings.jsx";
import { NODES } from "@/popup/utils/dummy-data.js";

function Layout(props) {
  return (
    <>
      <Header />
      <Body>{props.children}</Body>
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
              navigate(`/home/nodes/${rootNode.id}`, { replace: true });
            }
          }}
        />
        <Route path="/home/nodes/:id" component={Node} />
        <Route
          path="/home/nodes/:id/posts"
          component={() => <div>Posts Page</div>}
        />
        <Route path="/no-feeds-yet" component={NoFeedsYet} />
        <Route path="/add-feed" component={AddFeed} />
        <Route path="/add-folder" component={AddFolder} />
        <Route path="/import-feeds" component={ImportFeeds} />
        <Route path="/bookmarks" component={() => <div>Bookmarks</div>} />
        <Route path="/settings" component={Settings} />
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
