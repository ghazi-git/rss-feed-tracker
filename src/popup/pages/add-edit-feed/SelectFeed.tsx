import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import InputField from "@/popup/components/forms/Input";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./SelectFeed.module.css";

export default function SelectFeed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
    feedURL?: string;
  }>();
  const [feedURL, setFeedURL] = createSignal(searchParams.feedURL ?? "");

  return (
    <>
      <PageHeader
        text="Select Feed"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prevSearchString = getSearchString({
            ...searchParams,
            feedURL: feedURL(),
          });
          const nextSearchString = getSearchString({
            ...searchParams,
            previousUrl: `/library/feeds/select?${prevSearchString}`,
            feedURL: feedURL(),
          });
          navigate(`/library/feeds/add?${nextSearchString}`);
        }}
      >
        <div class={styles["enter-url"]}>
          <InputField
            type="url"
            name="url"
            placeholder="Enter Feed URL"
            aria-label="Enter Feed URL"
            required={true}
            value={feedURL()}
            onInput={(e) => setFeedURL(e.target.value)}
          />
          <UnstyledButton type="submit" class={styles.preview}>
            Preview
          </UnstyledButton>
        </div>
        <div class={styles.or}>OR</div>
        <div class={styles["find-feeds"]}>
          <UnstyledButton>Find Feeds in the Current Browser Tab</UnstyledButton>
        </div>
      </form>
    </>
  );
}
