import { splitProps } from "solid-js";

import styles from "./TriangleIcon.module.css";

export default function TriangleIcon(props) {
  const [extra, rest] = splitProps(props, ["class"]);
  const orientation = () => props.orientation ?? "down";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 9"
      fill="currentColor"
      stroke="currentColor"
      class={`${styles.triangle} ${orientation() === "up" ? styles.up : ""} ${extra.class ?? ""}`}
      {...rest}
    >
      <polygon points="1 0, 11 0, 6 8" />
    </svg>
  );
}
