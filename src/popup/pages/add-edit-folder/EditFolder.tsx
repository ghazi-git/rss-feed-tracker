import { useParams, useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { NODES } from "@/popup/utils/dummy-data";
import { notifyError } from "@/popup/utils/notifications";

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
  const [parentOptions, setParentOptions] = createSignal<SelectOption[]>([]);
  onMount(async () => {
    const resp = await sendMessage("folders/options", undefined);
    if (resp.success) {
      const options = resp.data.map((p) => {
        if (p.value === parseInt(params.id)) {
          return { ...p, disabled: true };
        } else {
          return p;
        }
      });
      setParentOptions(options);
    } else {
      notifyError("Unable to fetch parent folder options.");
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
      <form
        method="post"
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
        }}
      >
        <InputField
          type="text"
          name="name"
          label="Name"
          required={true}
          value={formdata.name}
          onInput={(e) => setFormdata("name", e.target.value)}
        />
        <Show when={!isRoot()}>
          <SelectField
            name="parent"
            label="Parent Folder"
            options={parentOptions()}
            value={formdata.parent ?? undefined}
            onChange={(e) => setFormdata("parent", parseInt(e.target.value))}
          />
        </Show>
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}

interface FolderFormdata {
  name: string;
  parent: number | null;
}
