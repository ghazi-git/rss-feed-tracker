import { JSX, Show, splitProps } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";

import styles from "./ManageDataButton.module.css";

export default function ManageDataButton(props: ManageDataButtonProps) {
  const [local, rest] = splitProps(props, ["loading", "class", "children"]);

  return (
    <UnstyledButton
      class={`${styles["data-button"]} ${local.class ?? ""}`}
      disabled={local.loading}
      {...rest}
    >
      {local.children}
      <Show when={local.loading}>
        <LoadingIcon />
      </Show>
    </UnstyledButton>
  );
}

interface ManageDataButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
