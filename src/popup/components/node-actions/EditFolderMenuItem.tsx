import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFolderMenuItem(props: { folderId: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editUrl = createMemo(() => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({ previousUrl: currentUrl });
    return `/library/folders/${props.folderId}/edit?${searchString}`;
  });

  return <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>;
}
