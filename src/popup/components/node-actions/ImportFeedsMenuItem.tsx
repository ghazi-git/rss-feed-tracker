import { useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

export default function ImportFeedsMenuItem(props: { folderId: number }) {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const importFeedsUrl = createMemo(() => {
    const searchString = getSearchString({
      previousUrl: currentURL(),
      parentFolderId: `${props.folderId}`,
    });
    return `/library/feeds/import?${searchString}`;
  });

  return (
    <MenuItem onClick={() => navigate(importFeedsUrl())}>Import Feeds</MenuItem>
  );
}
