import BackLink from "@/popup/components/BackLink.jsx";

import styles from "./PageTitle.module.css";

export default function PageTitle(props) {
  return (
    <div class={styles.container}>
      <BackLink url={props.previousUrl} />
      <h2>{props.text}</h2>
    </div>
  );
}
