import { splitProps } from "solid-js";

import styles from "./TriangleIcon.module.css";

export default function TriangleIcon(props) {
  const [extra, rest] = splitProps(props, ["class"]);
  const orientation = () => props.orientation ?? "down";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 183"
      fill="currentColor"
      class={`${styles.triangle} ${orientation() === "up" ? styles.up : ""} ${extra.class ?? ""}`}
      {...rest}
    >
      <path d="M136.753 168.234C124.116 187.491 95.8844 187.491 83.2467 168.234L5.69093 50.0574C-8.27459 28.7772 6.99068 0.5 32.4442 0.5L187.556 0.5C213.009 0.5 228.275 28.7772 214.309 50.0574L136.753 168.234Z" />
    </svg>
  );
}
