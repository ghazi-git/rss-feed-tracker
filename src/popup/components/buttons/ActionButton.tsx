import { JSX, Show, splitProps } from "solid-js";

import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";

import styles from "./ActionButton.module.css";

export default function ActionButton(props: ButtonProps) {
  const [extra, btnProps] = splitProps(props, ["class", "loading", "children"]);
  return (
    <button
      class={`btn ${extra.class ?? ""}`}
      disabled={extra.loading}
      {...btnProps}
    >
      {extra.children}
      <Show when={props.loading}>
        <LoadingIcon class={styles.loading} />
      </Show>
    </button>
  );
}

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
