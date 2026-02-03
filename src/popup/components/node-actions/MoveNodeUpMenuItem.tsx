import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useMoveNodeContext } from "@/popup/pages/node/move-node-context";

export default function MoveNodeUpMenuItem(props: MoveNodeUpMenuItemProps) {
  const { modeNodeUpOrDown } = useMoveNodeContext();
  const { closeMenu, focusTrigger } = useDropdownContext();
  return (
    <MenuItem
      onClick={() => {
        if (!props.disabled) {
          modeNodeUpOrDown(props.nodeId, "up").then(() => {
            closeMenu();
            focusTrigger();
          });
        }
      }}
      aria-disabled={props.disabled || undefined}
    >
      Move Up
    </MenuItem>
  );
}

interface MoveNodeUpMenuItemProps {
  nodeId: number;
  disabled: boolean;
}
