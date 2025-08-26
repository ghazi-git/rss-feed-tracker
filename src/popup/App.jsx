import { Route, Router, useNavigate } from "@solidjs/router";

import Body from "@/popup/components/Body.jsx";
import Header from "@/popup/components/Header.jsx";
import AddFeed from "@/popup/pages/add-feed/index.jsx";
import AddFolder from "@/popup/pages/add-folder/index.jsx";
import ImportFeeds from "@/popup/pages/import-feeds/index.jsx";
import NoFeedsYet from "@/popup/pages/no-feeds-yet/index.jsx";
import Settings from "@/popup/pages/Settings.jsx";

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
    <Router root={Layout}>
      <Route path="/feeds" component={() => <div>Have feeds</div>} />
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
            navigate("/feeds", { replace: true });
          } else {
            navigate("/no-feeds-yet", { replace: true });
          }
        }}
      />
    </Router>
  );
}

export default App;
