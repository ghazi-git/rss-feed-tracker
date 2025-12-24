import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { batch, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { createMutation } from "@/popup/utils/mutation";
import { notifySuccess } from "@/popup/utils/notifications";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFolder() {
  const { mutation, sendMsg } = createMutation("folders/update");
  const navigate = useNavigate();
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
    const folderId = parseInt(params.id);
    const response = await sendMessage("folders/get", { id: folderId });
    if (response.success) {
      batch(() => {
        const { folderOptions, name, parentFolder } = response.data;
        const options = folderOptions.map((p) => {
          if (p.value === folderId) {
            return { ...p, disabled: true };
          } else {
            return p;
          }
        });
        setParentOptions(options);
        if (!parentFolder) setIsRoot(true);
        setFormdata({ name, parent: parentFolder });
      });
    } else {
      const searchString = getSearchString({ msg: response.errorMsg });
      navigate(`/library/not-found?${searchString}`);
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
        onSubmit={async (event) => {
          event.preventDefault();
          const id = parseInt(params.id);
          await sendMsg({
            id,
            name: formdata.name,
            parentFolder: formdata.parent,
          });
          if (mutation.isSuccess) {
            notifySuccess("Folder updated successfully.");
            navigate(searchParams.previousUrl ?? `/library/nodes/${id}/posts`);
          }
        }}
      >
        <ErrorAlert errorMsg={mutation.errorMsg} />
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
          <ActionButton type="submit" loading={mutation.isLoading}>
            Save
          </ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}

interface FolderFormdata {
  name: string;
  parent: number | null;
}
