import { useNavigate, useSearchParams } from "@solidjs/router";
import {
  createResource,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import InputField from "@/popup/components/forms/Input";
import PageHeader from "@/popup/components/page-header/PageHeader";
import SingleLineText from "@/popup/components/SingleLineText";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import { notifyError, notifyInfo } from "@/popup/utils/notifications";
import { getSearchString } from "@/popup/utils/urls";
import { glogger } from "@/utils/logging";

import styles from "./SelectFeed.module.css";

export default function SelectFeed() {
  let input!: HTMLInputElement;
  onMount(() => input.focus());

  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
    feedURL?: string;
  }>();
  const [feedURL, setFeedURL] = createSignal(searchParams.feedURL ?? "");
  const [feeds, { refetch }] = createResource(
    // eslint-disable-next-line solid/reactivity
    async () => {
      const response = await sendMessage("feeds/find", undefined);
      if (!response.success) throw new Error(response.errorMsg);

      return response.data;
    },
    { initialValue: [] },
  );

  const goToAddFeedPage = (url: string) => {
    const prevSearchString = getSearchString({ ...searchParams, feedURL: url });
    const nextSearchString = getSearchString({
      ...searchParams,
      previousUrl: `/library/feeds/select?${prevSearchString}`,
      feedURL: url,
    });
    navigate(`/library/feeds/add?${nextSearchString}`);
  };

  return (
    <>
      <PageHeader
        text="Select Feed"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToAddFeedPage(feedURL());
        }}
      >
        <div class={styles["enter-url"]}>
          <InputField
            ref={input}
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
      </form>
      <div class={styles.or}>OR</div>
      <div class={styles["find-feeds"]}>
        <UnstyledButton disabled={feeds.loading} onClick={() => refetch()}>
          Find Feeds in the Current Browser Tab
          <Show when={feeds.loading}>
            <LoadingIcon />
          </Show>
        </UnstyledButton>
      </div>
      <Switch>
        <Match when={feeds.error}>
          <div class={styles.error}>{feeds.error.message}</div>
        </Match>
        <Match when={!feeds.loading}>
          <Show
            when={feeds.latest.length > 0}
            fallback={
              <div class={styles["no-feeds-found"]}>
                No feeds found in the current browser tab. You can click the
                button above to check again.
              </div>
            }
          >
            <div class={styles["feeds-found"]}>
              Feed(s) found in the current browser tab:
            </div>
            <For each={feeds.latest}>
              {(feed) => (
                <>
                  <div class={styles.header}>
                    <CopyLinkButton url={feed.url} />
                    <SingleLineText
                      class={styles.title}
                      text={decodeURI(feed.url)}
                    />
                    <Show
                      when={!feed.subscribed}
                      fallback={
                        <span class={styles.subscribed}>Subscribed</span>
                      }
                    >
                      <UnstyledButton
                        class={styles.preview}
                        onClick={() => goToAddFeedPage(feed.url)}
                      >
                        Preview
                      </UnstyledButton>
                    </Show>
                  </div>
                  <div class={styles.metadata} dir="auto">
                    {feed.title}: {feed.description}
                  </div>
                  <hr class={styles.separator} />
                </>
              )}
            </For>
          </Show>
        </Match>
      </Switch>
    </>
  );
}

function CopyLinkButton(props: { url: string }) {
  return (
    <UnstyledButton
      class={styles.copy}
      onClick={() => {
        navigator.clipboard
          .writeText(props.url)
          .then(() => {
            notifyInfo("Link copied.", { duration: 2000 });
          })
          .catch((e) => {
            glogger.error("copy-link: failure", e);
            notifyError("Failed to copy the link.");
          });
      }}
    >
      ⧉
    </UnstyledButton>
  );
}
