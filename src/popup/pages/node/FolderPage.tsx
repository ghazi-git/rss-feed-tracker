import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";

import { Folder, TreeNode } from "@/db-setup";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderNoChildren from "@/popup/pages/node/FolderNoChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";
import { useNodeContext } from "@/popup/pages/node/node-context";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";
import { handleFilterShortcut } from "@/popup/utils/filter";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { useSearchIndexState } from "@/popup/utils/search";
import { getSearchString } from "@/popup/utils/urls";

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

  const isSearchIndexReady = useSearchIndexState();
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  // eslint-disable-next-line solid/reactivity
  handleFilterShortcut(() => {
    const searchString = getSearchString({
      previousUrl: currentURL(),
      nodeName: props.folder.name,
    });
    if (isSearchIndexReady()) {
      navigate(`/library/nodes/${props.folder.id}/search?${searchString}`);
    } else {
      navigate(`/library/nodes/${props.folder.id}/filter?${searchString}`);
    }
  });

  return (
    <UnreadCountContext.Provider value={{ mutateUnreadCount }}>
      <FolderPageHeader
        folder={props.folder}
        hasChildren={props.folder.children.length > 0}
      />
      <Show
        when={props.folder.children.length > 0}
        fallback={<FolderNoChildren folderId={props.folder.id} />}
      >
        <DeleteNodeProvider>
          <FolderChildren childNodes={props.folder.children} />
          <DeleteNodeDialog />
        </DeleteNodeProvider>
      </Show>
    </UnreadCountContext.Provider>
  );
}

interface FolderPageProps {
  folder: Folder & {
    markAsReadUntil: number;
    children: (TreeNode & { markAsReadUntil: number })[];
  };
}
