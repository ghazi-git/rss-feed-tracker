import { useNavigate, useSearchParams } from "@solidjs/router";
import { batch, createSignal, onMount } from "solid-js";
import { createStore } from "solid-js/store";

import { sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";

export default function AddFolder() {
  const [searchParams] = useSearchParams<{
    parentFolderId?: string;
    previousUrl?: string;
  }>();
  const [formdata, setFormdata] = createStore({
    name: "",
    parentFolder: parseInt(searchParams.parentFolderId ?? "") || null,
  });
  const [parentOptions, setParentOptions] = createSignal<SelectOption[]>([]);
  const { mutation, sendMsg } = createMutation("folders/create");
  const navigate = useNavigate();

  onMount(async () => {
    const resp = await sendMessage("folders/options", undefined);
    if (resp.success) {
      batch(() => {
        setParentOptions(resp.data);
        if (formdata.parentFolder === null) {
          setFormdata("parentFolder", resp.data[0].value);
        }
      });
    } else {
      notifyError("Unable to fetch parent folder options.");
    }
  });

  return (
    <>
      <PageHeader
        text="Add Folder"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        method="post"
        onSubmit={async (event) => {
          event.preventDefault();
          if (formdata.parentFolder) {
            await sendMsg({
              name: formdata.name,
              parentFolder: formdata.parentFolder,
            });
            if (mutation.isSuccess) {
              notifySuccess("Feed created successfully.");
              navigate(`/library/nodes/${mutation.data.folderId}`);
            }
          } else {
            notifyError("Please select a parent folder.");
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
        <SelectField
          name="parentFolder"
          label="Parent Folder"
          options={parentOptions()}
          required={true}
          value={formdata.parentFolder ?? undefined}
          onChange={(e) =>
            setFormdata("parentFolder", parseInt(e.target.value))
          }
        />
        <ButtonContainer>
          <ActionButton type="submit" loading={mutation.isLoading}>
            Save
          </ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
