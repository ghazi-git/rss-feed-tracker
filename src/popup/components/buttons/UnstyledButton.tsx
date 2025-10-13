import { JSX, splitProps } from "solid-js";

import styles from "./UnstyledButton.module.css";

export default function UnstyledButton(props: ButtonProps) {
  const [extra, btnProps] = splitProps(props, ["class"]);
  return (
    <button
      type="button"
      class={`${styles.unstyled} ${extra.class ?? ""}`}
      {...btnProps}
    />
  );
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;
