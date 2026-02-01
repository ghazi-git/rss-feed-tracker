import { FlowProps } from "solid-js";

import styles from "./PageHeaderWrapper.module.css";

export default function PageHeaderWrapper(props: PageHeaderWrapperProps) {
  return (
    <div
      class={props.sticky ? styles.sticky : ""}
      style={{ "view-transition-name": "page-header" }}
    >
      <div class={styles["page-header-wrapper"]}>{props.children}</div>
    </div>
  );
}

interface PageHeaderWrapperProps extends FlowProps {
  sticky?: boolean;
}
