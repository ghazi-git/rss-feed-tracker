import { For, splitProps } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper.jsx";
import { setId } from "@/popup/components/forms/utils.js";

import styles from "./Select.module.css";

export default function SelectField(props) {
  const propsWithId = setId(props);
  const [extra, selectProps] = splitProps(propsWithId, [
    "options",
    "label",
    "class",
    "value",
  ]);

  return (
    <FieldWrapper
      label={extra.label}
      labelFor={selectProps.id}
      required={selectProps.required}
    >
      <select class={`${styles.select} ${extra.class ?? ""}`} {...selectProps}>
        <For each={extra.options}>
          {({ label, value, ...rest }) => {
            let selected = false;
            if ((!value && !extra.value) || value === extra.value) {
              selected = "selected";
            }
            return (
              <option value={value ?? ""} selected={selected} {...rest}>
                {label}
              </option>
            );
          }}
        </For>
      </select>
    </FieldWrapper>
  );
}
