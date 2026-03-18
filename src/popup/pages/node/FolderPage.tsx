import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";

import { Folder, TreeNode } from "@/db-setup";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderNoChildren from "@/popup/pages/node/FolderNoChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";
import { ListNavigationContextProvider } from "@/popup/pages/node/list-navigation-context";
import { useNodeContext } from "@/popup/pages/node/node-context";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import {
  handleFilterShortcut,
  handleSearchShortcut,
} from "@/popup/utils/shortcuts";
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

  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  // eslint-disable-next-line solid/reactivity
  handleFilterShortcut(() => {
    const searchString = getSearchString({
      previousUrl: currentURL(),
      nodeName: props.folder.name,
      // default to filtering all posts when shortcut is triggered from
      // the folder page
      postsView: "all",
    });
    navigate(`/library/nodes/${props.folder.id}/filter?${searchString}`);
  });
  // eslint-disable-next-line solid/reactivity
  handleSearchShortcut(() => {
    const searchString = getSearchString({
      previousUrl: currentURL(),
      nodeName: props.folder.name,
    });
    navigate(`/library/nodes/${props.folder.id}/search?${searchString}`);
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
          <ListNavigationContextProvider
            listLength={props.folder.children.length}
          >
            <FolderChildren
              childNodes={props.folder.children}
              parentId={props.folder.parentId}
            />
          </ListNavigationContextProvider>
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
