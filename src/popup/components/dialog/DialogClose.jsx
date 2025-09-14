import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDialogContext } from "@/popup/components/dialog/context.js";
import CloseIcon from "@/popup/components/svg-icons/CloseIcon.jsx";

import styles from "./DialogClose.module.css";

export default function DialogClose(props) {
  const { close } = useDialogContext();

  return (
    <span onClick={close}>
      {props.children ?? (
        <UnstyledButton class={styles.close}>
          <CloseIcon />
        </UnstyledButton>
      )}
    </span>
  );
}
