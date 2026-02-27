import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
} from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifyInfo } from "@/popup/utils/notifications";

export default function SearchIndexButton(props: { class: string }) {
  const { mutation, sendMsg } = createMutation("search-index/trigger-rebuild");
  const [trigger, setTrigger] = createSignal(0);
  const [reindex, { mutate: mutateReindex }] = createResource(
    trigger,
    async () => {
      const response = await sendMessage(
        "search-index/is-rebuild-in-progress",
        undefined,
      );
      if (!response.success) throw new Error(response.errorMsg);

      return response.data;
    },
    { initialValue: false },
  );

  let timerID: number;
  createEffect(() => {
    const reindexingInProgress = reindex.latest;
    if (reindexingInProgress) {
      // poll to see if the reindexing finished
      timerID = setInterval(() => setTrigger(Date.now()), 2000);
    } else {
      // when reindexing finishes, stop polling
      if (timerID) clearInterval(timerID);
    }
  });
  onCleanup(() => {
    if (timerID) clearInterval(timerID);
  });

  return (
    <ManageDataButton
      class={props.class}
      loading={mutation.isLoading || reindex.latest}
      onClick={() => {
        sendMsg(undefined).then(() => {
          if (mutation.isSuccess) {
            mutateReindex(true);
            notifyInfo("Rebuilding the search index is now in progress");
          } else if (mutation.isError) {
            notifyError(mutation.errorMsg);
          }
        });
      }}
    >
      {mutation.isLoading || reindex.latest
        ? "Rebuilding Search Index"
        : "Rebuild Search Index"}
    </ManageDataButton>
  );
}
