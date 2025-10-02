import { useNavigate, useSearchParams } from "@solidjs/router";
import { batch, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { PostPreview } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import FeedPostsPreview from "@/popup/pages/add-edit-feed/FeedPostsPreview";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import PreviewFeedForm from "@/popup/pages/add-edit-feed/PreviewFeedForm";
import { getParentOptions } from "@/popup/pages/add-edit-folder/FolderForm";
import { usePreferencesContext } from "@/popup/utils/preferences-storage";

import styles from "./AddFeed.module.css";

export default function AddFeed() {
  const { store } = usePreferencesContext();
  const [step, setStep] = createSignal<"preview" | "save">("preview");
  const [feedURL, setFeedURL] = createSignal("");
  const [feedPosts, setFeedPosts] = createSignal<PostPreview[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
  }>();
  const [formdata, setFormdata] = createStore({
    url: "",
    name: "",
    frequency: store.defaultFeedUpdateFrequency,
    folder: parseInt(searchParams.parentFolderId ?? "") || null,
  });

  return (
    <>
      <PageHeader
        text="Add Feed"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <Show when={step() === "preview"}>
        <PreviewFeedForm
          onFeedDataReceived={(data) => {
            batch(() => {
              setFormdata("url", feedURL());
              setFormdata("name", data.feedName);
              setFeedPosts(data.posts);
              setStep("save");
            });
          }}
          url={feedURL()}
          setURL={setFeedURL}
        />
      </Show>

      <Show when={step() === "save"}>
        <form
          class={styles["feed-form"]}
          onSubmit={(event) => {
            event.preventDefault();
            console.log("formdata", formdata);
            navigate("/library");
          }}
        >
          <InputField
            type="url"
            name="url"
            label="URL"
            required={true}
            value={formdata.url}
            onInput={(e) => setFormdata("url", e.target.value)}
          />
          <FeedPostsPreview posts={feedPosts()} />
          <InputField
            type="text"
            name="name"
            label="Name"
            required={true}
            value={formdata.name}
            onInput={(e) => setFormdata("name", e.target.value)}
          />
          <FrequencyField
            required={true}
            value={formdata.frequency}
            onChange={(e) => setFormdata("frequency", parseInt(e.target.value))}
          />
          <SelectField
            name="folder"
            label="Folder"
            options={getParentOptions()}
            value={formdata.folder ?? ""}
            onChange={(e) => setFormdata("folder", parseInt(e.target.value))}
          />
          <ButtonContainer>
            <ActionButton type="submit">Save</ActionButton>
          </ButtonContainer>
        </form>
      </Show>
    </>
  );
}
