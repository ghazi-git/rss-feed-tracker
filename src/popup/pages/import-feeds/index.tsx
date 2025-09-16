import { useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { getParentOptions } from "@/popup/pages/add-edit-folder/FolderForm";

export default function ImportFeeds() {
  const [searchParams] = useSearchParams<{
    previousUrl?: string;
    parentFolderId?: string;
  }>();
  const [formdata, setFormdata] = createStore<ImportFormData>({
    file: null,
    parent: parseInt(searchParams.parentFolderId ?? "") || null,
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
          options={getParentOptions()}
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
