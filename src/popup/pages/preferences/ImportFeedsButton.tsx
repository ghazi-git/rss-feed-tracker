import { useNavigate } from "@solidjs/router";

import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

export default function ImportFeedsButton() {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const importURL = () => {
    const searchString = getSearchString({ previousUrl: currentURL() });
    return `/library/feeds/import?${searchString}`;
  };

  return (
    <ManageDataButton onClick={() => navigate(importURL())}>
      Import Feeds
    </ManageDataButton>
  );
}
