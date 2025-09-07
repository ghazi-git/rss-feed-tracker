import { useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/PageHeader.jsx";
import FolderForm from "@/popup/pages/add-folder/FolderForm.jsx";
import { getParentOptions } from "@/popup/pages/add-folder/parent-options.js";

export default function AddFolder() {
  const [formdata, setFormdata] = createStore({
    name: "",
    parent: "",
  });
  const [searchParams] = useSearchParams();
  return (
    <>
      <PageHeader
        text="Add Folder"
        previousUrl={searchParams.previousUrl ?? "/home"}
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
