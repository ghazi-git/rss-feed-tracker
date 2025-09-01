import Anchor from "@/popup/components/Anchor.jsx";
import PreviousIcon from "@/popup/components/svg-icons/PreviousIcon.jsx";

import styles from "./PageTitle.module.css";

export default function PageTitle(props) {
  return (
    <div class={styles.container}>
      <Anchor href={props.previousUrl}>
        <PreviousIcon />
      </Anchor>
      <h2>{props.text}</h2>
    </div>
  );
}
