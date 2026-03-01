import { createResource, Setter, Show } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./SearchIndexButton.module.css";

export default function SearchIndexButton(props: SearchIndexButtonProps) {
  const { mutation, sendMsg } = createMutation("search-index/trigger-rebuild");
  const [rebuilding, { refetch }] = createResource(
    // eslint-disable-next-line solid/reactivity
    async () => {
      const response = await sendMessage(
        "search-index/rebuild-progress-msg",
        undefined,
      );
      if (!response.success) throw new Error(response.errorMsg);

      return response.data;
    },
    { initialValue: null },
  );

  return (
    <div class={`${styles["search-index"]} ${props.class}`}>
      <ManageDataButton
        disabled={props.disabled || !!rebuilding.latest}
        loading={mutation.isLoading}
        onClick={() => {
          // eslint-disable-next-line solid/reactivity
          sendMsg(undefined).then(() => {
            if (mutation.isSuccess) {
              refetch();
              props.setDisabled(true);
            } else if (mutation.isError) {
              notifyError(mutation.errorMsg);
            }
          });
        }}
      >
        {props.disabled ? "Rebuilding Search Index..." : "Rebuild Search Index"}
      </ManageDataButton>
      <Show when={rebuilding.latest}>{(msg) => <p>{msg()}</p>}</Show>
    </div>
  );
}

interface SearchIndexButtonProps {
  class: string;
  disabled: boolean;
  setDisabled: Setter<boolean>;
}
