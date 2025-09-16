import { ParentProps } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDialogContext } from "@/popup/components/dialog/context";
import CloseIcon from "@/popup/components/svg-icons/CloseIcon";

import styles from "./DialogClose.module.css";

export default function DialogClose(props: ParentProps) {
  const { close } = useDialogContext();

  return (
    <span onClick={() => close()}>
      {props.children ?? (
        <UnstyledButton class={styles.close}>
          <CloseIcon />
        </UnstyledButton>
      )}
    </span>
  );
}
