import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { onMount } from "solid-js";
import { createStore } from "solid-js/store";

import { FeedFormData, sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import { getParentOptions } from "@/popup/pages/add-edit-folder/FolderForm";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFeed() {
  const navigate = useNavigate();
  const [formdata, setFormdata] = createStore<FeedFormData>({
    url: "",
    name: "",
    frequency: 2 * 60 * 60 * 1000,
    folder: 0,
  });
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  const params = useParams();
  onMount(async () => {
    const id = parseInt(params.id);
    const response = await sendMessage("feeds/get", { id });
    if (response.success) {
      setFormdata(response.data);
    } else {
      const searchString = getSearchString({ msg: response.errorMsg });
      navigate(`/library/not-found?${searchString}`);
    }
  });

  return (
    <>
      <PageHeader
        text="Edit Feed"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
          navigate("/library");
        }}
      >
        <ErrorAlert errorMsg={"store.errorMsg"} />
        <InputField
          type="url"
          name="url"
          label="URL"
          required={true}
          value={formdata.url}
          onInput={(e) => setFormdata("url", e.target.value)}
        />
        <InputField
          type="text"
          name="name"
          label="Name"
          required={true}
          value={formdata.name}
          onInput={(e) => setFormdata("name", e.target.value)}
        />
        <FrequencyField
          required={true}
          value={formdata.frequency}
          onChange={(e) => setFormdata("frequency", parseInt(e.target.value))}
        />
        <SelectField
          name="folder"
          label="Folder"
          options={getParentOptions()}
          required={true}
          value={formdata.folder ?? ""}
          onChange={(e) => setFormdata("folder", parseInt(e.target.value))}
        />
        <ButtonContainer>
          <ActionButton type="submit">Save</ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
