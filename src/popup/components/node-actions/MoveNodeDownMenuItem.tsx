import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useMoveNodeContext } from "@/popup/pages/node/move-node-context";

export default function MoveNodeDownMenuItem(props: { nodeId: number }) {
  const { modeNodeUpOrDown } = useMoveNodeContext();
  return (
    <MenuItem
      onClick={() => {
        modeNodeUpOrDown(props.nodeId, "down");
      }}
    >
      Move Down
    </MenuItem>
  );
}
