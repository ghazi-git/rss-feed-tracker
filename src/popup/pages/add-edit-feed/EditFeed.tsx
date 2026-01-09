import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { batch, createSignal, onMount } from "solid-js";
import { createStore } from "solid-js/store";

import { sendMessage, UpdateFeedFormData } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import { createMutation } from "@/popup/utils/mutation";
import { notifySuccess } from "@/popup/utils/notifications";
import { getSearchString } from "@/popup/utils/urls";

export default function EditFeed() {
  const { mutation, sendMsg } = createMutation("feeds/update");
  const navigate = useNavigate();
  const [formdata, setFormdata] = createStore<UpdateFeedFormData>({
    url: "",
    name: "",
    frequency: 2 * 60 * 60 * 1000,
    folder: 0,
    iconURL: "",
  });
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  const params = useParams();
  const [folderOptions, setFolderOptions] = createSignal<SelectOption[]>([]);
  onMount(async () => {
    const id = parseInt(params.id);
    const response = await sendMessage("feeds/get", { id });
    if (response.success) {
      batch(() => {
        const { folderOptions: options, ...feedData } = response.data;
        setFolderOptions(options);
        setFormdata(feedData);
      });
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
        onSubmit={async (event) => {
          event.preventDefault();
          const id = parseInt(params.id);
          await sendMsg({ ...formdata, id });
          if (mutation.isSuccess) {
            notifySuccess("Feed updated successfully.");
            navigate(searchParams.previousUrl ?? `/library/nodes/${id}/posts`);
          }
        }}
      >
        <ErrorAlert errorMsg={mutation.errorMsg} />
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
        <InputField
          type="url"
          name="iconURL"
          label="Icon URL"
          helpText="The icon will be cached after the first time it is shown"
          value={formdata.iconURL}
          onInput={(e) => setFormdata("iconURL", e.target.value)}
        />
        <SelectField
          name="folder"
          label="Folder"
          options={folderOptions()}
          required={true}
          value={formdata.folder ?? ""}
          onChange={(e) => setFormdata("folder", parseInt(e.target.value))}
        />
        <ButtonContainer>
          <ActionButton type="submit" loading={mutation.isLoading}>
            Save
          </ActionButton>
        </ButtonContainer>
      </form>
    </>
  );
}
