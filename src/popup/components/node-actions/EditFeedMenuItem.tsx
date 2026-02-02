import { useLocation, useNavigate } from "@solidjs/router";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFeedMenuItem(props: { feedId: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editUrl = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({ previousUrl: currentUrl });
    return `/library/feeds/${props.feedId}/edit?${searchString}`;
  };

  return <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>;
}
