import { JSX, Setter } from "solid-js";

import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";

export default function PreviewFeedForm(props: PreviewFeedFormProps) {
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
        value={props.url}
        onInput={(e) => props.setURL(e.target.value)}
      />
      <ButtonContainer>
        <ActionButton type="submit">Preview</ActionButton>
      </ButtonContainer>
    </form>
  );
}

interface PreviewFeedFormProps {
  onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent>;
  url: string;
  setURL: Setter<string>;
}
