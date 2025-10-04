import { Show } from "solid-js";

import styles from "./ErrorAlert.module.css";

export default function ErrorAlert(props: { errorMsg: string | null }) {
  return (
    <Show when={props.errorMsg}>
      <div class={styles.alert}>{props.errorMsg}</div>
    </Show>
  );
}
