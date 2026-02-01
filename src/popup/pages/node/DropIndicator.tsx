import styles from "./DropIndicator.module.css";

export default function DropIndicator(props: {
  placement: "reorder-before" | "reorder-after";
}) {
  return (
    <div
      class={styles.indicator}
      classList={{
        [styles.start]: props.placement === "reorder-before",
        [styles.end]: props.placement === "reorder-after",
      }}
    >
      <div class={styles.line}>
        <div class={`${styles.donut} ${styles.start}`} />
        <div class={`${styles.donut} ${styles.end}`} />
      </div>
    </div>
  );
}
