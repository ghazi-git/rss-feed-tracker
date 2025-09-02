import styles from "./NoPosts.module.css";

export default function NoPosts(props) {
  return <h3 class={styles["no-posts"]}>{props.msg}</h3>;
}
