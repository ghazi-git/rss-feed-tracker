import { FlowProps, Show } from "solid-js";

import styles from "./FieldWrapper.module.css";

export function FieldWrapper(props: FieldWrapperProps) {
  return (
    <div class={styles["field-wrapper"]}>
      <Show when={props.label}>
        <label for={props.labelFor} id={props.labelId}>
          {props.label}
          <Show when={props.required}>
            <span class={styles["required-asterisk"]}>*</span>
          </Show>
        </label>
      </Show>
      {props.children}
    </div>
  );
}

type FieldWrapperProps = FlowProps<{
  label?: string;
  labelFor?: string;
  labelId?: string;
  required?: boolean;
}>;
