import { useNavigate, useSearchParams } from "@solidjs/router";
import { batch, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/page-header/PageHeader";
import FeedForm from "@/popup/pages/add-edit-feed/FeedForm";
import PreviewFeedForm from "@/popup/pages/add-edit-feed/PreviewFeedForm";

export default function AddFeed() {
  const [step, setStep] = createSignal<"preview" | "save">("preview");
  const [feedURL, setFeedURL] = createSignal("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
  }>();
  const [formdata, setFormdata] = createStore({
    url: "",
    name: "",
    frequency: 2 * 60 * 60 * 1000,
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
          onSubmit={(event) => {
            event.preventDefault();
            console.log("feedURL()", feedURL());
            batch(() => {
              setFormdata("url", feedURL());
              setStep("save");
            });
          }}
          url={feedURL()}
          setURL={setFeedURL}
        />
      </Show>

      <Show when={step() === "save"}>
        <FeedForm
          onSubmit={(event) => {
            event.preventDefault();
            console.log("formdata", formdata);
            navigate("/library");
          }}
          formdata={formdata}
          setFormdata={setFormdata}
        />
      </Show>
    </>
  );
}
