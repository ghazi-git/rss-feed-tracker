import { useLocation, useNavigate } from "@solidjs/router";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { getSearchString } from "@/popup/utils/urls";

export default function SearchMenuItem(props: { nodeId: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchUrl = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({ previousUrl: currentUrl });
    return `/library/nodes/${props.nodeId}/search?${searchString}`;
  };

  return <MenuItem onClick={() => navigate(searchUrl())}>Search</MenuItem>;
}
