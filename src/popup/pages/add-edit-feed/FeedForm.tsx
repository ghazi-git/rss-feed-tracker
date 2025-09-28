import { JSX } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import { getParentOptions } from "@/popup/pages/add-edit-folder/FolderForm";

export default function FeedForm(props: FeedFormProps) {
  return (
    <form
      onSubmit={(e) => {
        props.onSubmit(e);
      }}
    >
      <InputField
        type="url"
        name="url"
        label="URL"
        required={true}
        value={props.formdata.url}
        onInput={(e) => props.setFormdata("url", e.target.value)}
      />
      <InputField
        type="text"
        name="name"
        label="Name"
        required={true}
        value={props.formdata.name}
        onInput={(e) => props.setFormdata("name", e.target.value)}
      />
      <FrequencyField
        required={true}
        value={props.formdata.frequency}
        onChange={(e) =>
          props.setFormdata("frequency", parseInt(e.target.value))
        }
      />
      <SelectField
        name="folder"
        label="Folder"
        options={getParentOptions()}
        value={props.formdata.folder ?? ""}
        onChange={(e) => props.setFormdata("folder", parseInt(e.target.value))}
      />
      <ButtonContainer>
        <ActionButton type="submit">Save</ActionButton>
      </ButtonContainer>
    </form>
  );
}

export interface FeedFormProps {
  onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent>;
  formdata: FeedFormdata;
  setFormdata: SetStoreFunction<FeedFormdata>;
}

export interface FeedFormdata {
  url: string;
  name: string;
  frequency: number;
  folder: number | null;
}
