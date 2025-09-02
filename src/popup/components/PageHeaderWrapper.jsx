import styles from "./PageHeaderWrapper.module.css";

export default function PageHeaderWrapper(props) {
  return <div class={styles["page-header-wrapper"]}>{props.children}</div>;
}
