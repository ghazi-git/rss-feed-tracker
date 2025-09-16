import { useParams, useSearchParams } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/page-header/PageHeader";
import FolderForm, {
  FolderFormdata,
  getParentOptions,
} from "@/popup/pages/add-edit-folder/FolderForm";
import { NODES } from "@/popup/utils/dummy-data";

export default function EditFolder() {
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
  }>();
  const params = useParams();
  const [formdata, setFormdata] = createStore<FolderFormdata>({
    name: "",
    parent: null,
  });
  const [isRoot, setIsRoot] = createSignal(false);
  const parentOptions = getParentOptions().map((p) => {
    if (p.value === parseInt(params.id)) {
      return { ...p, disabled: true };
    } else {
      return p;
    }
  });

  createEffect(() => {
    const node = NODES.find((n) => n.id === parseInt(params.id));
    if (node) {
      if (!node.parentId) setIsRoot(true);
      setFormdata({ name: node.name, parent: node.parentId });
    }
  });

  return (
    <>
      <PageHeader
        text="Edit Folder"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <FolderForm
        formdata={formdata}
        setFormdata={setFormdata}
        isRoot={isRoot()}
        parentOptions={parentOptions}
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
        }}
      />
    </>
  );
}
