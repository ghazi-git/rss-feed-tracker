import { useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import ActionButton from "@/popup/components/buttons/ActionButton.jsx";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer.jsx";
import InputField from "@/popup/components/forms/Input.jsx";
import SelectField from "@/popup/components/forms/Select.jsx";
import PageHeader from "@/popup/components/page-header/PageHeader.jsx";
import { getParentOptions } from "@/popup/pages/add-edit-folder/FolderForm.jsx";

export default function ImportFeeds() {
  const [searchParams] = useSearchParams();
  const [formdata, setFormdata] = createStore({
    file: "",
    parent: searchParams.parentFolderId || null,
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
          required="required"
          accept=".xml"
          onChange={(e) => setFormdata("file", e.target.files[0])}
        />
        <SelectField
          name="parent"
          label="Parent Folder"
          options={getParentOptions()}
          value={parseInt(formdata.parent)}
          onChange={(e) => setFormdata("parent", e.target.value)}
        />
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
