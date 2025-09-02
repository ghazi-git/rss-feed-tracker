import { useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import ActionButton from "@/popup/components/ActionButton.jsx";
import ButtonContainer from "@/popup/components/ButtonContainer.jsx";
import InputField from "@/popup/components/forms/Input.jsx";
import PageHeader from "@/popup/components/PageHeader.jsx";

export default function ImportFeeds() {
  const [formdata, setFormdata] = createStore({
    file: "",
  });
  const [searchParams] = useSearchParams();
  return (
    <>
      <PageHeader
        text="Import Feeds"
        previousUrl={searchParams.previousUrl ?? "/home"}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
        }}
      >
        <InputField
          type="file"
          name="file"
          label="OPML File"
          required="required"
          accept=".xml"
          onChange={(e) => setFormdata("file", e.target.files[0])}
        />
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
