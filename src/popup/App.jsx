import { Route, Router, useNavigate } from "@solidjs/router";

import Body from "@/popup/components/Body.jsx";
import Header from "@/popup/components/Header.jsx";
import NoFeedsYet from "@/popup/pages/no-feeds-yet/index.jsx";

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
      <Route path="/bookmarks" component={() => <div>Bookmarks</div>} />
      <Route path="/settings" component={() => <div>Settings</div>} />
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
