import { splitProps } from "solid-js";

import styles from "./UnstyledButton.module.css";

export default function UnstyledButton(props) {
  const [extra, btnProps] = splitProps(props, ["class"]);
  return (
    <button class={`${styles.unstyled} ${extra.class ?? ""}`} {...btnProps} />
  );
}
