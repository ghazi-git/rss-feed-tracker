import { JSX, splitProps } from "solid-js";

import styles from "./ActionButton.module.css";

export default function ActionButton(props: ButtonProps) {
  const [extra, btnProps] = splitProps(props, ["class"]);
  return (
    <button class={`${styles.button} ${extra.class ?? ""}`} {...btnProps} />
  );
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;
