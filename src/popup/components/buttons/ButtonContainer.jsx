import styles from "./ButtonContainer.module.css";

export default function ButtonContainer(props) {
  return <div class={styles["button-container"]}>{props.children}</div>;
}
