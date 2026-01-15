import { useNavigate, useSearchParams } from "@solidjs/router";
import { batch, createSignal, onMount } from "solid-js";
import { createStore } from "solid-js/store";

import { sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField, { SelectOption } from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";

export default function ImportFeeds() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  const { mutation, sendMsg: importOPML } = createMutation("opml/import");
  const [searchParams] = useSearchParams<{
    previousUrl?: string;
    parentFolderId?: string;
  }>();
  const [formdata, setFormdata] = createStore<ImportFormData>({
    file: null,
    parent: parseInt(searchParams.parentFolderId ?? "") || null,
  });
  const [parentOptions, setParentOptions] = createSignal<SelectOption[]>([]);
  onMount(async () => {
    const resp = await sendMessage("folders/options", undefined);
    if (resp.success) {
      batch(() => {
        setParentOptions(resp.data);
        if (formdata.parent === null) {
          setFormdata("parent", resp.data[0].value);
        }
      });
    } else {
      notifyError("Unable to fetch folder options.");
    }
  });

  const onSubmit = async (file: File | null, parent: number | null) => {
    if (!file || !parent) {
      setErrorMsg("Both fields are required.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".opml")) {
      setErrorMsg("The selected file should have the extension 'opml'.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // OPML files contain just a list of feeds so they're usually below
      // 1MB. Also, keep in mind the limit for message passing is 64MB.
      // https://developer.chrome.com/docs/extensions/develop/concepts/messaging#message_size_limits
      setErrorMsg("The file is too big (more than 10MB).");
      return;
    }
    const content = await file.text();
    if (!content.trim()) {
      setErrorMsg("Empty file.");
      return;
    }

    setErrorMsg(null);
    await importOPML({ fileContent: content, folder: parent });
    if (mutation.isSuccess) {
      notifySuccess(
        "Feeds created. The posts are being loaded in the background.",
      );
      navigate(`/library/nodes/${parent}`);
    }
  };

  return (
    <>
      <PageHeader
        text="Import Feeds"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(formdata.file, formdata.parent);
        }}
      >
        <ErrorAlert errorMsg={errorMsg() || mutation.errorMsg} />
        <InputField
          type="file"
          name="file"
          label="OPML File"
          required={true}
          accept=".opml"
          onChange={(e) => setFormdata("file", e.target.files?.item(0) ?? null)}
        />
        <SelectField
          name="parent"
          label="Parent Folder"
          options={parentOptions()}
          required={true}
          value={formdata.parent ?? undefined}
          onChange={(e) => setFormdata("parent", parseInt(e.target.value))}
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

interface ImportFormData {
  file: File | null;
  parent: number | null;
}
