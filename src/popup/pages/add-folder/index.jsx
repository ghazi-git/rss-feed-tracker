import { createStore } from "solid-js/store";

import ActionButton from "@/popup/components/ActionButton.jsx";
import ButtonContainer from "@/popup/components/ButtonContainer.jsx";
import InputField from "@/popup/components/forms/Input.jsx";
import SelectField from "@/popup/components/forms/Select.jsx";

export default function AddFolder() {
  const [formdata, setFormdata] = createStore({
    name: "Test",
    parent: "News",
  });
  const options = [
    { label: "None (i.e. Top-level Folder)", value: "" },
    { label: "Dev", value: "Dev" },
    { label: "News", value: "News" },
    { label: "Other", value: "Other" },
  ];
  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
        }}
      >
        <InputField
          type="text"
          name="name"
          label="Name"
          required="required"
          value={formdata.name}
          onInput={(e) => setFormdata("name", e.target.value)}
        />
        <SelectField
          name="parent"
          label="Parent Folder"
          options={options}
          value={formdata.parent}
          onChange={(e) => setFormdata("parent", e.target.value)}
        />
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
