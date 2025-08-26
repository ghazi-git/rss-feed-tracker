import Anchor from "@/popup/components/Anchor.jsx";
import PreviousIcon from "@/popup/components/svg-icons/PreviousIcon.jsx";

import styles from "./PageTitle.module.css";

export default function PageTitle(props) {
  return (
    <div
      class={`${styles.container} ${props.margin ? styles["extra-margin"] : ""}`}
    >
      <Anchor href="#" onClick={() => history.back()}>
        <PreviousIcon />
      </Anchor>
      <h2>{props.text}</h2>
    </div>
  );
}
