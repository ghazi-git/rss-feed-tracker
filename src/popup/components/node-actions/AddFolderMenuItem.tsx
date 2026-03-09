import { useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

export default function AddFolderMenuItem(props: { folderId: number }) {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const addFolderUrl = createMemo(() => {
    const searchString = getSearchString({
      previousUrl: currentURL(),
      parentFolderId: `${props.folderId}`,
    });
    return `/library/folders/add?${searchString}`;
  });

  return (
    <MenuItem onClick={() => navigate(addFolderUrl())}>Add Folder</MenuItem>
  );
}
