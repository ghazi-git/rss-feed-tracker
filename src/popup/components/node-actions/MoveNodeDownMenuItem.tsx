import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import { useMoveNodeContext } from "@/popup/pages/node/move-node-context";

export default function MoveNodeDownMenuItem(props: MoveNodeDownMenuItemProps) {
  const { modeNodeUpOrDown } = useMoveNodeContext();
  const { closeMenu, focusTrigger } = useDropdownContext();
  return (
    <MenuItem
      onClick={() => {
        if (!props.disabled) {
          modeNodeUpOrDown(props.nodeId, "down").then(() => {
            closeMenu();
            setTimeout(focusTrigger, 20);
          });
        }
      }}
      aria-disabled={props.disabled || undefined}
    >
      Move Down
    </MenuItem>
  );
}

interface MoveNodeDownMenuItemProps {
  nodeId: number;
  disabled: boolean;
}
