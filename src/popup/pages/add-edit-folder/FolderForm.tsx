import { JSX, Show } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import { Folder, NODES } from "@/popup/utils/dummy-data";

export default function FolderForm(props: FolderFormProps) {
  return (
    <form
      onSubmit={(e) => {
        props.onSubmit(e);
      }}
      method="post"
    >
      <InputField
        type="text"
        name="name"
        label="Name"
        required={true}
        value={props.formdata.name}
        onInput={(e) => props.setFormdata("name", e.target.value)}
      />
      <Show when={!props.isRoot}>
        <SelectField
          name="parent"
          label="Parent Folder"
          options={props.parentOptions}
          value={props.formdata.parent ?? undefined}
          onChange={(e) =>
            props.setFormdata("parent", parseInt(e.target.value))
          }
        />
      </Show>
      <ButtonContainer>
        <ActionButton type="submit">Save</ActionButton>
      </ButtonContainer>
    </form>
  );
}

export function getParentOptions() {
  const folders = NODES.filter((n) => n.type === "folder");
  const root = folders.find((f) => f.parentId === null);
  if (!root) return [];

  const orderedFolders = getFoldersTree(root, folders);
  return orderedFolders.map(([n, level]) => {
    return {
      // \xa0 is a non-breaking space used to illustrate the tree hierarchy
      label: `${"\xa0".repeat(level * 4)}${n.name}`,
      value: n.id,
    };
  });
}

/**
 * return an array of folders ordered according to a DFS traversal and their
 * sortOrder within their parent
 */
function getFoldersTree(rootFolder: Folder, folders: Folder[]) {
  const result: StackItem[] = [];
  const stack: StackItem[] = [[rootFolder, 0]];

  while (stack.length > 0) {
    const [folder, level] = stack.shift()!;
    result.push([folder, level]);

    const children = folders.filter((f) => f.parentId === folder.id);
    children.sort((f1, f2) => f1.sortOrder - f2.sortOrder);
    stack.unshift(...children.map((f) => [f, level + 1] as StackItem));
  }
  return result;
}

type StackItem = [Folder, number];

interface FolderFormProps {
  onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent>;
  formdata: FolderFormdata;
  setFormdata: SetStoreFunction<FolderFormdata>;
  isRoot?: boolean;
  parentOptions: { label: string; value: number }[];
}

export interface FolderFormdata {
  name: string;
  parent: number | null;
}
