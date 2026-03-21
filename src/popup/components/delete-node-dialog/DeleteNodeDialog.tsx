import { useNavigate } from "@solidjs/router";
import { Signal } from "solid-js";

import ActionButton from "@/popup/components/buttons/ActionButton";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import { useDropdownContext } from "@/popup/components/dropdown/context";
import ErrorAlert from "@/popup/components/ErrorAlert";
import CloseIcon from "@/popup/components/svg-icons/CloseIcon";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import { useNodeContext } from "@/popup/pages/node/node-context";
import { getListItemFromNode, isFocusedNode } from "@/popup/utils/keyboard-nav";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";

import styles from "./DeleteNodeDialog.module.css";

export default function DeleteNodeDialog() {
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

  const mutateNode = useMutateNode();
  const itemSignal = useFocusedItem();
  const removeChildNode = (deletedNodeId: number) => {
    if (mutateNode && itemSignal) {
      const [focusedItem, setFocusedItem] = itemSignal;
      let nextFocusedItem: string | null = null;
      mutateNode((resp) => {
        const deletionIdx = resp.children.findIndex(
          (n) => n.id === deletedNodeId,
        );
        if (deletionIdx >= 0) {
          const deletedNode = resp.children[deletionIdx];
          const nodeUnreadCount = resp.unreadCount - deletedNode.unreadCount;
          const updatedChildren = resp.children.toSpliced(deletionIdx, 1);
          // determine the item to be focused next for keyboard navigation in
          // case the deleted node is currently the focused item
          if (
            updatedChildren.length > 0 &&
            isFocusedNode(focusedItem(), deletedNode.id)
          ) {
            const newItemAtDeletedIndex =
              updatedChildren[
                Math.min(deletionIdx, updatedChildren.length - 1)
              ];
            nextFocusedItem = getListItemFromNode(newItemAtDeletedIndex.id);
          }
          return {
            ...resp,
            unreadCount: Math.max(nodeUnreadCount, 0),
            children: updatedChildren,
          };
        }

        return resp;
      });
      if (nextFocusedItem) {
        // the timeout ensures the node gets focused otherwise the html body
        // gets focused by default after closing the modal
        setTimeout(() => setFocusedItem(nextFocusedItem));
      }
    }
  };

  const closeModal = useCloseDropdown();
  const confirmDeletion = async () => {
    if (store.nodeId) {
      if (store.nodeType === "folder") {
        await sendMsgFolder({ id: store.nodeId });
        if (folderMutation.isSuccess) {
          notifySuccess("Folder Deleted.");
          if (store.deletionTrigger === "nodeHeader") {
            closeModal?.();
            navigate(
              store.parentFolderId
                ? `/library/nodes/${store.parentFolderId}`
                : "/library",
            );
          } else {
            removeChildNode(store.nodeId);
          }
          dialogRef.close();
        }
      } else {
        await sendMsgFeed({ id: store.nodeId });
        if (feedMutation.isSuccess) {
          notifySuccess("Feed Deleted.");
          if (store.deletionTrigger === "nodeHeader") {
            closeModal?.();
            navigate(
              store.parentFolderId
                ? `/library/nodes/${store.parentFolderId}`
                : "/library",
            );
          } else {
            removeChildNode(store.nodeId);
          }
          dialogRef.close();
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

function useMutateNode() {
  // context-node is provided in the Node component only where we display folder
  // children and need to update the node children after deleting folder/feed
  try {
    const { mutateNode } = useNodeContext();
    return mutateNode;
  } catch {
    return undefined;
  }
}

function useFocusedItem() {
  // list navigation context is provided in the Node component only where we
  // display folder children. That's where we potentially need to update the
  // focused list item
  try {
    const { focusedItem, setFocusedItem } = useListNavigationContext();
    return [focusedItem, setFocusedItem] as Signal<string | null>;
  } catch {
    return undefined;
  }
}

function useCloseDropdown() {
  // when the deletion is triggered from the node header, we need to close
  // the dropdown menu since it's open. That is not needed when the deletion
  // is triggered from the folder child.
  // Keep in mind that The dropdown is left open after clicking delete to return
  // the focus to the deletion menu item if the user does not confirm the
  // deletion (clicks cancel or closes the modal). Without the open dropdown,
  // focus is lost post-modal closing. This can be annoying for keyboard users.
  try {
    const { closeMenu } = useDropdownContext();
    return closeMenu;
  } catch {
    return undefined;
  }
}
