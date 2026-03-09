import { useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFolderMenuItem(props: { folderId: number }) {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const editUrl = createMemo(() => {
    const searchString = getSearchString({ previousUrl: currentURL() });
    return `/library/folders/${props.folderId}/edit?${searchString}`;
  });

  return <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>;
}
