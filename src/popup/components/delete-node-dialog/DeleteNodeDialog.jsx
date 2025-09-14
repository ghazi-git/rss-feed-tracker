import { showToast } from "solid-notifications";

import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context.jsx";
import Dialog from "@/popup/components/dialog/Dialog.jsx";
import DialogClose from "@/popup/components/dialog/DialogClose.jsx";
import DialogTitle from "@/popup/components/dialog/DialogTitle.jsx";

import styles from "./DeleteNodeDialog.module.css";

export default function DeleteNodeDialog() {
  const { store, closeModal } = useDeleteNodeContext();

  return (
    <Dialog
      open={store.open}
      onClose={(event) => {
        console.log("event", event);
        closeModal();
      }}
    >
      <DialogTitle>{store.modalTitle}</DialogTitle>
      <p class={styles.text}>{store.modalText}</p>
      <ButtonContainer>
        <DialogClose>
          <UnstyledButton class={styles.cancel}>Cancel</UnstyledButton>
        </DialogClose>
        <DialogClose>
          <ActionButton
            class={styles.delete}
            onClick={() => {
              showToast(`Deleting Node (do sth with nodeId ${store.nodeId})`);
            }}
          >
            Yes
          </ActionButton>
        </DialogClose>
      </ButtonContainer>
    </Dialog>
  );
}
