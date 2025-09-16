import { useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/page-header/PageHeader";
import FolderForm, {
  getParentOptions,
} from "@/popup/pages/add-edit-folder/FolderForm";

export default function AddFolder() {
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
  }>();
  const [formdata, setFormdata] = createStore({
    name: "",
    parent: parseInt(searchParams.parentFolderId ?? "") || null,
  });
  return (
    <>
      <PageHeader
        text="Add Folder"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <FolderForm
        formdata={formdata}
        setFormdata={setFormdata}
        parentOptions={getParentOptions()}
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
        }}
      />
    </>
  );
}
