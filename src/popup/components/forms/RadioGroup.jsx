import { For } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper.jsx";
import { setId } from "@/popup/components/forms/utils.js";

import styles from "./RadioGroup.module.css";

export default function RadioGroup(props) {
  const propsWithId = setId(props);
  const options = () => {
    return propsWithId.options.map(({ label, value }, index) => {
      return {
        label,
        value,
        id: `id_${propsWithId.name}_${index}`,
      };
    });
  };

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
        <For each={options()}>
          {({ label, value, id }) => {
            return (
              <label for={id}>
                <input
                  type="radio"
                  name={propsWithId.name}
                  id={id}
                  onChange={propsWithId.onChange}
                  value={value}
                  checked={value === propsWithId.value ? "checked" : undefined}
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
