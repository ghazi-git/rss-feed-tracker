import { Show } from "solid-js";

import MenuItem from "@/popup/components/dropdown/MenuItem";
import Separator from "@/popup/components/dropdown/Separator";
import { useMoveNodeContext } from "@/popup/pages/node/move-node-context";

/**
 * These menu items are added as an alternative flow for sorting nodes with
 * drag and drop based on atlassian accessibility guidelines
 * https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines
 */
export default function MoveNodeMenuItems(props: MoveNodeMenuItemsProps) {
  const { modeNodeUpOrDown } = useMoveNodeContext();
  return (
    <>
      <Show when={props.showMoveUp}>
        <MenuItem
          onClick={() => {
            modeNodeUpOrDown(props.nodeId, "up");
          }}
        >
          Move Up
        </MenuItem>
      </Show>
      <Show when={props.showMoveDown}>
        <MenuItem
          onClick={() => {
            modeNodeUpOrDown(props.nodeId, "down");
          }}
        >
          Move Down
        </MenuItem>
      </Show>
      <Separator />
    </>
  );
}

interface MoveNodeMenuItemsProps {
  nodeId: number;
  showMoveUp: boolean;
  showMoveDown: boolean;
}
