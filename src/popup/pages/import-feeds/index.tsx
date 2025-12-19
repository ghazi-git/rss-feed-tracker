import { useSearchParams } from "@solidjs/router";
import { batch, createSignal, onMount } from "solid-js";
import { createStore } from "solid-js/store";

import { sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { notifyError } from "@/popup/utils/notifications";

export default function ImportFeeds() {
  const [searchParams] = useSearchParams<{
    previousUrl?: string;
    parentFolderId?: string;
  }>();
  const [formdata, setFormdata] = createStore<ImportFormData>({
    file: null,
    parent: parseInt(searchParams.parentFolderId ?? "") || null,
  });
  const [parentOptions, setParentOptions] = createSignal<SelectOption[]>([]);
  onMount(async () => {
    const resp = await sendMessage("folders/options", undefined);
    if (resp.success) {
      batch(() => {
        setParentOptions(resp.data);
        if (formdata.parent === null) {
          setFormdata("parent", resp.data[0].value);
        }
      });
    } else {
      notifyError("Unable to fetch folder options.");
    }
  });

  return (
    <>
      <PageHeader
        text="Import Feeds"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
        }}
      >
        <InputField
          type="file"
          name="file"
          label="OPML File"
          required={true}
          accept=".xml"
          onChange={(e) => setFormdata("file", e.target.files?.item(0) ?? null)}
        />
        <SelectField
          name="parent"
          label="Parent Folder"
          options={parentOptions()}
          value={formdata.parent ?? undefined}
          onChange={(e) => setFormdata("parent", parseInt(e.target.value))}
        />
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}

interface ImportFormData {
  file: File | null;
  parent: number | null;
}
