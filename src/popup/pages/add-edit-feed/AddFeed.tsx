import { useNavigate, useSearchParams } from "@solidjs/router";
import {
  batch,
  createEffect,
  createSignal,
  Match,
  onMount,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";

import { FeedFormData, sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import FeedPostsPreview from "@/popup/pages/add-edit-feed/FeedPostsPreview";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

import styles from "./AddFeed.module.css";

export default function AddFeed() {
  const { mutation: createFeedMutation, sendMsg: createFeed } =
    createMutation("feeds/create");
  const { preferences } = usePreferencesContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
    feedURL?: string;
  }>();
  const [formdata, setFormdata] = createStore({
    url: searchParams.feedURL ?? "",
    name: "",
    frequency: preferences.defaultFeedUpdateFrequency as number | null,
    folder: parseInt(searchParams.parentFolderId ?? "") || null,
  });
  // fetch a few posts of the feed
  const { mutation: previewMutation, sendMsg: previewFeed } =
    createMutation("feeds/preview");
  onMount(async () => {
    if (formdata.url) {
      await previewFeed({ url: formdata.url });
      if (previewMutation.isSuccess) {
        setFormdata("name", previewMutation.data.feedName);
      }
    }
  });
  // Preferences are stored in the extension stored which is accessed
  // asynchronously. So, when the user lands on this page directly after
  // opening the popup (if this is the last visited page), the preferences
  // have not been loaded yet. Thus, we need createEffect.
  createEffect(() => {
    setFormdata("frequency", preferences.defaultFeedUpdateFrequency);
  });
  // fetch the folder options
  const [folderOptions, setFolderOptions] = createSignal<SelectOption[]>([]);
  onMount(async () => {
    const resp = await sendMessage("folders/options", undefined);
    if (resp.success) {
      batch(() => {
        setFolderOptions(resp.data);
        if (formdata.folder === null) {
          setFormdata("folder", resp.data[0].value);
        }
      });
    } else {
      notifyError("Unable to fetch folder options.");
    }
  });

  return (
    <>
      <PageHeader
        text="Add Feed"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        class={styles["feed-form"]}
        onSubmit={async (event) => {
          event.preventDefault();
          await createFeed(formdata as FeedFormData);
          if (createFeedMutation.isSuccess) {
            notifySuccess("Feed created successfully.");
            navigate(`/library/nodes/${createFeedMutation.data.feedId}/posts`);
          }
        }}
      >
        <ErrorAlert errorMsg={createFeedMutation.errorMsg} />
        <InputField
          type="url"
          name="url"
          label="URL"
          required={true}
          value={formdata.url}
          onInput={(e) => setFormdata("url", e.target.value)}
        />
        <Switch>
          <Match when={previewMutation.isError}>
            <div class={styles.error}>{previewMutation.errorMsg}</div>
          </Match>
          <Match when={previewMutation.isLoading}>
            <div class={styles.fetching}>Fetching feed posts...</div>
          </Match>
          <Match when={previewMutation.isSuccess}>
            <FeedPostsPreview posts={previewMutation.data?.posts ?? []} />
          </Match>
        </Switch>
        <InputField
          type="text"
          name="name"
          label="Name"
          required={true}
          dir="auto"
          value={formdata.name}
          onInput={(e) => setFormdata("name", e.target.value)}
        />
        <FrequencyField
          required={true}
          value={formdata.frequency}
          onChange={(e) => {
            const val = e.target.value;
            setFormdata("frequency", val ? parseInt(val) : null);
          }}
        />
        <SelectField
          name="folder"
          label="Folder"
          options={folderOptions()}
          required={true}
          value={formdata.folder ?? ""}
          onChange={(e) => setFormdata("folder", parseInt(e.target.value))}
        />
        <ButtonContainer>
          <ActionButton type="submit" loading={createFeedMutation.isLoading}>
            Save
          </ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
