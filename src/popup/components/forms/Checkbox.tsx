import { JSX, Show } from "solid-js";

import { addDefaultId } from "@/popup/components/forms/utils";

import styles from "./Checkbox.module.css";

export default function Checkbox(props: CheckboxProps) {
  const propsWithId = addDefaultId(props);

  return (
    <div class={styles["field-wrapper"]}>
      <label for={propsWithId.id}>
        <input type="checkbox" checked={!!propsWithId.value} {...propsWithId} />
        <span>{propsWithId.label}</span>
      </label>
      <Show when={propsWithId.helpText}>
        <div class={styles["help-text"]}>{propsWithId.helpText}</div>
      </Show>
    </div>
  );
}

interface CheckboxProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  helpText?: string;
}
