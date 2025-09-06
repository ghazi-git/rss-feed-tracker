import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { showToast } from "solid-notifications";

import Dropdown from "@/popup/components/dropdown/Dropdown.jsx";
import Menu from "@/popup/components/dropdown/Menu.jsx";
import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import MenuStateIndicator from "@/popup/components/dropdown/MenuStateIndicator.jsx";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";
import PageTitle from "@/popup/components/PageTitle.jsx";

import styles from "./PageTitleButton.module.css";

export default function PageTitleButton(props) {
  const navigate = useNavigate();
  return (
    <Dropdown placement="bottom-start">
      <MenuTrigger class={styles["page-title-button"]}>
        <div class={styles["node-actions"]}>
          <MenuStateIndicator />
        </div>
        <PageTitle title={props.title} />
      </MenuTrigger>
      <Menu>
        <Show when={props.nodeType === "folder"}>
          <MenuItem onClick={() => navigate("/add-folder")}>Edit</MenuItem>
          <MenuItem onClick={() => showToast("Reloading Feeds...")}>
            Reload
          </MenuItem>
          <Separator />
          <MenuItem onClick={() => navigate("/add-feed")}>Add Feed</MenuItem>
          <MenuItem onClick={() => navigate("/add-folder")}>
            Add Folder
          </MenuItem>
          <Separator />
          <MenuItem onClick={() => navigate("/import-feeds")}>
            Import Feeds
          </MenuItem>
          <MenuItem
            onClick={() => showToast("Exporting Feeds under this folder...")}
          >
            Export Feeds
          </MenuItem>
          <Separator />
          <MenuItem
            class={styles.delete}
            onClick={() => showToast("show 'are you sure dialog'")}
          >
            Delete
          </MenuItem>
        </Show>
        <Show when={props.nodeType === "feed"}>
          <MenuItem onClick={() => navigate("/add-folder")}>Edit</MenuItem>
          <MenuItem onClick={() => showToast("Reloading Feeds...")}>
            Reload
          </MenuItem>
          <Separator />
          <MenuItem
            class={styles.delete}
            onClick={() => showToast("show 'are you sure dialog'")}
          >
            Delete
          </MenuItem>
        </Show>
      </Menu>
    </Dropdown>
  );
}
