import { Folder, TreeNode } from "@/db-setup";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";
import { useNodeContext } from "@/popup/pages/node/node-context";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";

export function FolderPage(props: FolderPageProps) {
  const { mutateNode } = useNodeContext();
  const mutateUnreadCount = ({ delta, value }: MutateUnreadCountArgs) => {
    if (delta) {
      mutateNode((resp) => ({
        ...resp,
        unreadCount: resp.unreadCount + delta,
      }));
    } else if (value !== undefined) {
      mutateNode((resp) => ({ ...resp, unreadCount: value }));
    }
  };

  return (
    <UnreadCountContext.Provider value={{ mutateUnreadCount }}>
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
    </UnreadCountContext.Provider>
  );
}

interface FolderPageProps {
  folder: Folder & {
    markAsReadUntil: number;
    children: (TreeNode & { markAsReadUntil: number })[];
  };
}
