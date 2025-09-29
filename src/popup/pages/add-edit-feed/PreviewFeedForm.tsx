import { createSignal, Setter } from "solid-js";

import { FeedPreview, sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";

export default function PreviewFeedForm(props: PreviewFeedFormProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const response = await sendMessage("feeds/preview", {
          url: props.url,
        });
        if (response?.success) {
          props.onFeedDataReceived(response.data);
        } else {
          const msg =
            "An unexpected error occurred during feed preview. Please try again.";
          setError(response?.errorMsg ?? msg);
        }
        setLoading(false);
      }}
    >
      <ErrorAlert errorMsg={error()} />
      <InputField
        type="url"
        name="url"
        label="URL"
        required={true}
        value={props.url}
        onInput={(e) => props.setURL(e.target.value)}
      />
      <ButtonContainer>
        <ActionButton type="submit" loading={loading()}>
          Preview
        </ActionButton>
      </ButtonContainer>
    </form>
  );
}

interface PreviewFeedFormProps {
  url: string;
  setURL: Setter<string>;
  onFeedDataReceived(data: FeedPreview): void;
}
