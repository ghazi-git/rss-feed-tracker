import { useNavigate } from "@solidjs/router";

import { createMutation } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import ErrorAlert from "@/popup/components/ErrorAlert";
import CloseIcon from "@/popup/components/svg-icons/CloseIcon";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";

import styles from "./DeleteNodeDialog.module.css";

export default function DeleteNodeDialog(props: {
  deletionTriggeredFrom: "nodePostsPage" | "parentFolderPage";
}) {
  let dialogRef!: HTMLDialogElement;
  const { store } = useDeleteNodeContext();
  const navigate = useNavigate();
  const {
    store: feedMutation,
    isLoading: isLoadingFeed,
    isSuccess: isSuccessFeed,
    sendMsg: sendMsgFeed,
    reset: resetFeed,
  } = createMutation("feeds/delete");
  // todo replace with folders/delete
  const {
    store: folderMutation,
    isLoading: isLoadingFolder,
    isSuccess: isSuccessFolder,
    sendMsg: sendMsgFolder,
    reset: resetFolder,
  } = createMutation("feeds/get");

  const modalTitle = () =>
    store.nodeType === "folder" ? "Delete Folder" : "Delete Feed";
  const errorMsg = () =>
    store.nodeType === "folder"
      ? folderMutation.errorMsg
      : feedMutation.errorMsg;
  const isLoading = () =>
    store.nodeType === "folder"
      ? isLoadingFolder(folderMutation)
      : isLoadingFeed(feedMutation);

  const confirmDeletion = async () => {
    if (store.nodeId) {
      if (store.nodeType === "folder") {
        await sendMsgFolder({ id: store.nodeId });
        if (isSuccessFolder(folderMutation)) {
          notifySuccess("Folder Deleted.");
          if (props.deletionTriggeredFrom === "nodePostsPage") {
            navigate("/library");
          } else {
            // todo reload the parent folder list of children
            dialogRef.close();
          }
        }
      } else {
        await sendMsgFeed({ id: store.nodeId });
        if (isSuccessFeed(feedMutation)) {
          notifySuccess("Feed Deleted.");
          if (props.deletionTriggeredFrom === "nodePostsPage") {
            navigate("/library");
          } else {
            // todo reload the parent folder list of children
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
    >
      <header>
        <h2>
          {modalTitle()} {store.nodeId}
        </h2>
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
