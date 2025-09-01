import { useNavigate } from "@solidjs/router";
import { createStore } from "solid-js/store";

import ActionButton from "@/popup/components/ActionButton.jsx";
import ButtonContainer from "@/popup/components/ButtonContainer.jsx";
import InputField from "@/popup/components/forms/Input.jsx";
import RadioGroup from "@/popup/components/forms/RadioGroup.jsx";
import SelectField from "@/popup/components/forms/Select.jsx";
import PageTitle from "@/popup/components/PageTitle.jsx";

export default function AddFeed() {
  const navigate = useNavigate();
  const [formdata, setFormdata] = createStore({
    url: "",
    name: "",
    frequency: "2h",
    folder: "",
  });
  const frequencies = [
    { label: "1 hour", value: "1h" },
    { label: "2 hours", value: "2h" },
    { label: "4 hours", value: "4h" },
    { label: "6 hours", value: "6h" },
    { label: "1 day", value: "1d" },
  ];
  const folders = [
    { label: "None (i.e. Top-level Folder)", value: "" },
    { label: "Dev", value: "Dev" },
    { label: "News", value: "News" },
    { label: "Other", value: "Other" },
  ];
  return (
    <>
      <PageTitle text="Add Feed" previousUrl="/home" />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
          navigate("/home");
        }}
      >
        <InputField
          type="url"
          name="url"
          label="URL"
          required="required"
          value={formdata.url}
          onInput={(e) => setFormdata("url", e.target.value)}
        />
        <InputField
          type="text"
          name="name"
          label="Name"
          required="required"
          value={formdata.name}
          onInput={(e) => setFormdata("name", e.target.value)}
        />
        <RadioGroup
          name="frequency"
          label="Update Frequency"
          required="required"
          options={frequencies}
          value={formdata.frequency}
          onChange={(e) => setFormdata("frequency", e.target.value)}
        />
        <SelectField
          name="folder"
          label="Folder"
          options={folders}
          value={formdata.folder}
          onChange={(e) => setFormdata("folder", e.target.value)}
        />
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
