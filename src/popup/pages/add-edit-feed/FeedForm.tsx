import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import RadioGroup from "@/popup/components/forms/RadioGroup";
import SelectField from "@/popup/components/forms/Select";
import { getParentOptions } from "@/popup/pages/add-edit-folder/FolderForm";
import { JSX } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

export default function FeedForm(props: FeedFormProps) {
  const frequencies = [
    { label: "1 hour", value: 60 * 60 * 1000 },
    { label: "2 hours", value: 2 * 60 * 60 * 1000 },
    { label: "4 hours", value: 4 * 60 * 60 * 1000 },
    { label: "6 hours", value: 6 * 60 * 60 * 1000 },
    { label: "1 day", value: 24 * 60 * 60 * 1000 },
  ];

  return (
    <form onSubmit={props.onSubmit}>
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
      <RadioGroup
        name="frequency"
        label="Update Frequency"
        required={true}
        options={frequencies}
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
  onSubmit: FormProps["onSubmit"];
  formdata: FeedFormdata;
  setFormdata: SetStoreFunction<FeedFormdata>;
}

export interface FeedFormdata {
  url: string;
  name: string;
  frequency: number;
  folder: number | null;
}

type FormProps = JSX.FormHTMLAttributes<HTMLFormElement>;
