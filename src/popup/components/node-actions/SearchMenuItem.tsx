import { useNavigate } from "@solidjs/router";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useCurrentURL } from "@/popup/utils/last-visited-page";
import { getSearchString } from "@/popup/utils/urls";

export default function SearchMenuItem(props: { nodeId: number }) {
  const navigate = useNavigate();
  const currentURL = useCurrentURL();
  const searchUrl = () => {
    const searchString = getSearchString({ previousUrl: currentURL() });
    return `/library/nodes/${props.nodeId}/search?${searchString}`;
  };

  return <MenuItem onClick={() => navigate(searchUrl())}>Search</MenuItem>;
}
