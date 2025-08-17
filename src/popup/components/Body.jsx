import styles from "./Body.module.css";

export default function Body(props) {
  return <div class={styles.body}>{props.children}</div>;
}
