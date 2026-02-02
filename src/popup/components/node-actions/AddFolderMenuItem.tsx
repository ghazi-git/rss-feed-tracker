import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { getSearchString } from "@/popup/utils/urls";

export default function AddFolderMenuItem(props: { folderId: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const addFolderUrl = createMemo(() => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({
      previousUrl: currentUrl,
      parentFolderId: `${props.folderId}`,
    });
    return `/library/folders/add?${searchString}`;
  });

  return (
    <MenuItem onClick={() => navigate(addFolderUrl())}>Add Folder</MenuItem>
  );
}
