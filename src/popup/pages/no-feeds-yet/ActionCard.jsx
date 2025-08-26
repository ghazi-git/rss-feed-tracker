import styles from "@/popup/pages/no-feeds-yet/ActionCard.module.css";

export default function ActionCard(props) {
  return (
    <div
      class={styles.card}
      onClick={props.navigateTo}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          props.navigateTo();
        }
      }}
      role="link"
      tabindex="0"
    >
      {props.children}
      <h2>{props.text}</h2>
    </div>
  );
}
