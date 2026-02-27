import { useLocation, useNavigate } from "@solidjs/router";

import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { getSearchString } from "@/popup/utils/urls";

export default function ImportFeedsButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevUrlSearchString = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    return getSearchString({ previousUrl: currentUrl });
  };

  return (
    <ManageDataButton
      onClick={() => {
        navigate(`/library/feeds/import?${prevUrlSearchString()}`);
      }}
    >
      Import Feeds
    </ManageDataButton>
  );
}
