import { Show } from "solid-js";

import ActionButton from "@/popup/components/buttons/ActionButton.jsx";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer.jsx";
import InputField from "@/popup/components/forms/Input.jsx";
import SelectField from "@/popup/components/forms/Select.jsx";
import { NODES } from "@/popup/utils/dummy-data";

export default function FolderForm(props) {
  return (
    <form onSubmit={props.onSubmit} method="POST">
      <InputField
        type="text"
        name="name"
        label="Name"
        required="required"
        value={props.formdata.name}
        onInput={(e) => props.setFormdata("name", e.target.value)}
      />
      <Show when={!props.isRoot}>
        <SelectField
          name="parent"
          label="Parent Folder"
          options={props.parentOptions}
          value={parseInt(props.formdata.parent)}
          onChange={(e) => props.setFormdata("parent", e.target.value)}
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
function getFoldersTree(rootFolder, folders) {
  const result = [];
  const stack = [[rootFolder, 0]];

  while (stack.length > 0) {
    const [folder, level] = stack.shift();
    result.push([folder, level]);

    const children = folders.filter((f) => f.parentId === folder.id);
    children.sort((f1, f2) => f1.sortOrder - f2.sortOrder);
    stack.unshift(...children.map((f) => [f, level + 1]));
  }
  return result;
}
