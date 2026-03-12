import { createResource } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";

export function useSearchIndexState() {
  const [hasOperations] = createResource(
    // eslint-disable-next-line solid/reactivity
    async () => {
      const resp = await sendMessage(
        "search-index/has-unapplied-operations",
        undefined,
      );
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
    // default to true until we really know there are no operations to apply.
    // We want to avoid sending the user to a search page that displays
    // incomplete results
    { initialValue: true },
  );

  // eslint-disable-next-line solid/reactivity
  return () => !hasOperations.latest;
}
