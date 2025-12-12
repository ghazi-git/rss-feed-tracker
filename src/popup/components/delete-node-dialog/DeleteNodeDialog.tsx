import ActionButton from "@/popup/components/buttons/ActionButton";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import CloseIcon from "@/popup/components/svg-icons/CloseIcon";
import { notifyInfo } from "@/popup/utils/notifications";

import styles from "./DeleteNodeDialog.module.css";

export default function DeleteNodeDialog() {
  const { store } = useDeleteNodeContext();

  return (
    <dialog id="delete-dialog" class={styles.dialog} closedby="any">
      <header>
        <h2>{store.modalTitle}</h2>
        <UnstyledButton
          command="close"
          commandfor="delete-dialog"
          aria-label="Close modal"
        >
          <CloseIcon />
        </UnstyledButton>
      </header>

      <p class={styles.text}>{store.modalText}</p>

      <footer>
        <UnstyledButton
          class={styles.cancel}
          command="close"
          commandfor="delete-dialog"
        >
          Cancel
        </UnstyledButton>
        <ActionButton
          class={styles.delete}
          command="close"
          commandfor="delete-dialog"
          onClick={() => {
            notifyInfo(`Deleting Node (do sth with nodeId ${store.nodeId})`);
          }}
        >
          Yes
        </ActionButton>
      </footer>
    </dialog>
  );
}
