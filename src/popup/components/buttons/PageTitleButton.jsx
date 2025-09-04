import UnstyledButton from "@/popup/components/buttons/UnstyledButton.jsx";
import PageTitle from "@/popup/components/PageTitle.jsx";
import TriangleIcon from "@/popup/components/svg-icons/TriangleIcon.jsx";

import styles from "./PageTitleButton.module.css";

export default function PageTitleButton(props) {
  return (
    <UnstyledButton class={styles["page-title-button"]} dir="auto">
      <div class={styles["node-actions"]}>
        <TriangleIcon />
      </div>
      <PageTitle title={props.title} />
    </UnstyledButton>
  );
}
