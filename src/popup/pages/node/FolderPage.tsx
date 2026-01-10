import { Folder, TreeNode } from "@/background/db-setup";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";
import { useNodeContext } from "@/popup/pages/node/node-context";
import {
  PostsFilterUnreadCountContext,
  UpdateUnreadCountArgs,
} from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

export function FolderPage(props: FolderPageProps) {
  const { mutateNode } = useNodeContext();
  const updateUnreadCount = ({ delta, value }: UpdateUnreadCountArgs) => {
    if (delta) {
      mutateNode((resp) => {
        if (!resp) return resp;

        return { ...resp, unreadCount: resp.unreadCount + delta };
      });
    } else if (value !== undefined) {
      mutateNode((resp) => {
        if (!resp) return resp;

        return { ...resp, unreadCount: value };
      });
    }
  };

  const { mutation, sendMsg } = createMutation("posts/mark-all-posts-as-read");
  const markAsReadMutation = {
    async markAll() {
      await sendMsg({
        nodeId: props.folder.id,
        markAsReadUntil: props.folder.markAsReadUntil,
      });
      if (mutation.isSuccess) {
        // set the unread count of the folder and all its children to 0
        mutateNode((resp) => {
          if (!resp) return resp;

          const children = resp.children.map((c) => ({ ...c, unreadCount: 0 }));
          return { ...resp, unreadCount: 0, children };
        });
      } else if (mutation.isError) {
        notifyError(mutation.errorMsg);
      }
    },

    isLoading() {
      return mutation.isLoading;
    },
  };

  return (
    <PostsFilterUnreadCountContext.Provider
      value={{ markAsReadMutation, updateUnreadCount }}
    >
      <DeleteNodeProvider>
        <FolderPageHeader
          folder={props.folder}
          hasChildren={props.folder.children.length > 0}
        />
        <FolderChildren
          folderId={props.folder.id}
          childNodes={props.folder.children}
        />
        <DeleteNodeDialog />
      </DeleteNodeProvider>
    </PostsFilterUnreadCountContext.Provider>
  );
}

interface FolderPageProps {
  folder: Folder & {
    markAsReadUntil: number;
    children: (TreeNode & { markAsReadUntil: number })[];
  };
}
