import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useMoveNodeContext } from "@/popup/pages/node/move-node-context";

export default function MoveNodeUpMenuItem(props: { nodeId: number }) {
  const { modeNodeUpOrDown } = useMoveNodeContext();
  return (
    <MenuItem
      onClick={() => {
        modeNodeUpOrDown(props.nodeId, "up");
      }}
    >
      Move Up
    </MenuItem>
  );
}
