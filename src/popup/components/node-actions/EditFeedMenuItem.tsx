import { useNavigate } from "@solidjs/router";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFeedMenuItem(props: { feedId: number }) {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const editUrl = () => {
    const searchString = getSearchString({ previousUrl: currentURL() });
    return `/library/feeds/${props.feedId}/edit?${searchString}`;
  };

  return <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>;
}
