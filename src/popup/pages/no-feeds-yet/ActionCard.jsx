import styles from "@/popup/pages/no-feeds-yet/ActionCard.module.css";

export default function ActionCard(props) {
  return (
    <div class={styles.card}>
      {props.children}
      <h2>{props.text}</h2>
    </div>
  );
}
