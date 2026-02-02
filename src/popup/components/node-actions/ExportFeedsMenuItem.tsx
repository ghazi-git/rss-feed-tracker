import { Show } from "solid-js";

import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

export default function ExportFeedsMenuItem(props: { folderId: number }) {
  const { closeMenu } = useDropdownContext();
  const { mutation, sendMsg: triggerOPMLExport } = createMutation(
    "opml/trigger-export",
  );

  return (
    <MenuItem
      onClick={async () => {
        if (!mutation.isLoading) {
          await triggerOPMLExport({ folder: props.folderId });
          if (mutation.isError) {
            notifyError(mutation.errorMsg);
          }
          closeMenu();
        }
      }}
    >
      <Show when={mutation.isLoading} fallback="Export Feeds">
        Exporting...
      </Show>
    </MenuItem>
  );
}
