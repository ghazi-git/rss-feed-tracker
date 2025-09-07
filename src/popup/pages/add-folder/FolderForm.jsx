import { Show } from "solid-js";

import ActionButton from "@/popup/components/buttons/ActionButton.jsx";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer.jsx";
import InputField from "@/popup/components/forms/Input.jsx";
import SelectField from "@/popup/components/forms/Select.jsx";

export default function FolderForm(props) {
  return (
    <form onSubmit={props.onSubmit} method="POST">
      <InputField
        type="text"
        name="name"
        label="Name"
        required="required"
        value={props.formdata.name}
        onInput={(e) => props.setFormdata("name", e.target.value)}
      />
      <Show when={!props.isRoot}>
        <SelectField
          name="parent"
          label="Parent Folder"
          options={props.parentOptions}
          value={props.formdata.parent}
          onChange={(e) => props.setFormdata("parent", e.target.value)}
        />
      </Show>
      <ButtonContainer>
        <ActionButton type="submit">Save</ActionButton>
      </ButtonContainer>
    </form>
  );
}
