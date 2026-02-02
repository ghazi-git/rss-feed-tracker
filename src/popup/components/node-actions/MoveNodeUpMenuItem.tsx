import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useMoveNodeContext } from "@/popup/pages/node/move-node-context";

export default function MoveNodeUpMenuItem(props: { nodeId: number }) {
  const { modeNodeUpOrDown } = useMoveNodeContext();
  const { closeMenu, focusTrigger } = useDropdownContext();
  return (
    <MenuItem
      onClick={() => {
        modeNodeUpOrDown(props.nodeId, "up").then(() => {
          closeMenu();
          focusTrigger();
        });
      }}
    >
      Move Up
    </MenuItem>
  );
}
