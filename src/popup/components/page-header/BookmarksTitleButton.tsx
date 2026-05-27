import { useNavigate } from "@solidjs/router";

import Dropdown from "@/popup/components/dropdown/Dropdown";
import Menu from "@/popup/components/dropdown/Menu";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import PageTitleMenuTrigger from "@/popup/components/page-header/PageTitleMenuTrigger";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./PageTitleButton.module.css";

export default function BookmarksTitleButton() {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const searchUrl = () => {
    const searchString = getSearchString({ previousUrl: currentURL() });
    return `/bookmarks/search?${searchString}`;
  };

  return (
    <Dropdown placement="bottom-start">
      <PageTitleMenuTrigger title="Bookmarks" feedUpdatesOff={false} />
      <Menu class={styles["dropdown-menu"]}>
        <MenuItem onClick={() => navigate(searchUrl())}>Search</MenuItem>
      </Menu>
    </Dropdown>
  );
}
