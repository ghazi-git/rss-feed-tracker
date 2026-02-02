import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { getSearchString } from "@/popup/utils/urls";

export default function AddFeedMenuItem(props: { folderId: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const addFeedUrl = createMemo(() => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({
      previousUrl: currentUrl,
      parentFolderId: `${props.folderId}`,
    });
    return `/library/feeds/select?${searchString}`;
  });

  return <MenuItem onClick={() => navigate(addFeedUrl())}>Add Feed</MenuItem>;
}
