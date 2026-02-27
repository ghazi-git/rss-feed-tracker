import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

export default function ExportFeedsButton() {
  const { mutation, sendMsg } = createMutation("opml/trigger-root-export");

  return (
    <ManageDataButton
      loading={mutation.isLoading}
      onClick={() => {
        sendMsg(undefined).then(() => {
          if (mutation.isError) {
            notifyError(mutation.errorMsg);
          }
        });
      }}
    >
      Export Feeds
    </ManageDataButton>
  );
}
