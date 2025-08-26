import { For } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper.jsx";
import { setId } from "@/popup/components/forms/utils.js";

import styles from "./RadioGroup.module.css";

export default function RadioGroup(props) {
  const propsWithId = setId(props);

  return (
    <FieldWrapper
      label={propsWithId.label}
      labelId={propsWithId.id}
      required={propsWithId.required}
    >
      <div
        class={styles["radio-group"]}
        role="group"
        aria-labelledby={propsWithId.id}
      >
        <For each={propsWithId.options}>
          {({ label, value }, index) => {
            let checked = false;
            if (value === propsWithId.value) {
              checked = "checked";
            }
            return (
              <label for={`id_${propsWithId.name}_${index()}`}>
                <input
                  type="radio"
                  name={propsWithId.name}
                  id={`id_${propsWithId.name}_${index()}`}
                  value={value}
                  checked={checked}
                  onChange={propsWithId.onChange}
                />
                {label}
              </label>
            );
          }}
        </For>
      </div>
    </FieldWrapper>
  );
}
