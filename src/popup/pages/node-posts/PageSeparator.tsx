import styles from "./PageSeparator.module.css";

export default function PageSeparator(props: { page: number }) {
  return <div class={styles.separator}>Page {props.page}</div>;
}
