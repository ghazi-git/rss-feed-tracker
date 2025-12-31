import { useNavigate } from "@solidjs/router";
import { Setter } from "solid-js";

import { NodeResponse } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import ErrorAlert from "@/popup/components/ErrorAlert";
import CloseIcon from "@/popup/components/svg-icons/CloseIcon";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";

import styles from "./DeleteNodeDialog.module.css";

export default function DeleteNodeDialog(props: {
  updateChildNodes?: Setter<NodeResponse | undefined>;
}) {
  let dialogRef!: HTMLDialogElement;
  const { store } = useDeleteNodeContext();
  const navigate = useNavigate();
  const {
    mutation: feedMutation,
    sendMsg: sendMsgFeed,
    reset: resetFeed,
  } = createMutation("feeds/delete");
  const {
    mutation: folderMutation,
    sendMsg: sendMsgFolder,
    reset: resetFolder,
  } = createMutation("folders/delete");

  const modalTitle = () =>
    store.nodeType === "folder" ? "Delete Folder" : "Delete Feed";
  const errorMsg = () =>
    store.nodeType === "folder"
      ? folderMutation.errorMsg
      : feedMutation.errorMsg;
  const isLoading = () =>
    store.nodeType === "folder"
      ? folderMutation.isLoading
      : feedMutation.isLoading;
  const removeChildNode = (deletedNodeId: number) => {
    if (props.updateChildNodes) {
      props.updateChildNodes((resp) => {
        if (!resp) return resp;

        const deletionIdx = resp.children.findIndex(
          (n) => n.id === deletedNodeId,
        );
        if (deletionIdx >= 0) {
          const deletedNode = resp.children[deletionIdx];
          const nodeUnreadCount = resp.unreadCount - deletedNode.unreadCount;
          return {
            ...resp,
            unreadCount: Math.max(nodeUnreadCount, 0),
            children: resp.children.toSpliced(deletionIdx, 1),
          };
        }

        return resp;
      });
    }
  };

  const confirmDeletion = async () => {
    if (store.nodeId) {
      if (store.nodeType === "folder") {
        await sendMsgFolder({ id: store.nodeId });
        if (folderMutation.isSuccess) {
          notifySuccess("Folder Deleted.");
          if (store.deletionTrigger === "nodeHeader") {
            navigate("/library");
          } else {
            removeChildNode(store.nodeId);
            dialogRef.close();
          }
        }
      } else {
        await sendMsgFeed({ id: store.nodeId });
        if (feedMutation.isSuccess) {
          notifySuccess("Feed Deleted.");
          if (store.deletionTrigger === "nodeHeader") {
            navigate("/library");
          } else {
            removeChildNode(store.nodeId);
            dialogRef.close();
          }
        }
      }
    } else {
      dialogRef.close();
      notifyError(`Unable to determine which ${store.nodeType} to delete.`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="delete-dialog"
      class={styles.dialog}
      closedby="any"
      onToggle={(event) => {
        if (event.newState === "open") {
          // reset the mutation to hide any previous error alerts
          if (store.nodeType === "folder") {
            resetFolder();
          } else {
            resetFeed();
          }
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          // the default behavior is that escape click results in closing
          // the extension popup even when event.stopPropagation()
          // So, we avoid closing the modal and the extension popup with
          // event.preventDefault(), then manually close the modal
          event.preventDefault();
          dialogRef.close();
        }
      }}
    >
      <header>
        <h2>{modalTitle()}</h2>
        <UnstyledButton
          command="close"
          commandfor="delete-dialog"
          aria-label="Close modal"
        >
          <CloseIcon />
        </UnstyledButton>
      </header>

      <ErrorAlert errorMsg={errorMsg()} />

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
          loading={isLoading()}
          onClick={() => {
            confirmDeletion();
          }}
        >
          Yes
        </ActionButton>
      </footer>
    </dialog>
  );
}
