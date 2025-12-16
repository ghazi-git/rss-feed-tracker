import { Setter } from "solid-js";

import { createMutation, FeedPreviewResponse } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";

export default function PreviewFeedForm(props: PreviewFeedFormProps) {
  const { mutation, sendMsg } = createMutation("feeds/preview");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await sendMsg({ url: props.url });
        if (mutation.isSuccess) {
          props.onFeedDataReceived(mutation.data);
        }
      }}
    >
      <ErrorAlert errorMsg={mutation.errorMsg} />
      <InputField
        type="url"
        name="url"
        label="URL"
        required={true}
        value={props.url}
        onInput={(e) => props.setURL(e.target.value)}
      />
      <ButtonContainer>
        <ActionButton type="submit" loading={mutation.isLoading}>
          Preview
        </ActionButton>
      </ButtonContainer>
    </form>
  );
}

interface PreviewFeedFormProps {
  url: string;
  setURL: Setter<string>;
  onFeedDataReceived(data: FeedPreviewResponse): void;
}
