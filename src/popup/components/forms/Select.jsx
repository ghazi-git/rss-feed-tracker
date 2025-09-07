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
  const options = () => {
    return props.options.map(({ value, ...rest }) => {
      const updatedOption = { ...rest, value: value ?? "" };
      if ((!value && !extra.value) || value === extra.value) {
        return { ...updatedOption, selected: "selected" };
      } else {
        return updatedOption;
      }
    });
  };

  return (
    <FieldWrapper
      label={extra.label}
      labelFor={selectProps.id}
      required={selectProps.required}
    >
      <select class={`${styles.select} ${extra.class ?? ""}`} {...selectProps}>
        <For each={options()}>
          {({ label, ...rest }) => <option {...rest}>{label}</option>}
        </For>
      </select>
    </FieldWrapper>
  );
}
