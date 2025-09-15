import { For, JSX } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper";
import { addDefaultId } from "@/popup/components/forms/utils";

import styles from "./RadioGroup.module.css";

export default function RadioGroup(props: RadioGroupProps) {
  const propsWithId = addDefaultId(props);
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
                  checked={value === propsWithId.value}
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
type InputProps = JSX.InputHTMLAttributes<HTMLInputElement>;
interface RadioGroupProps {
  name: string;
  options: Option[];
  id?: InputProps["id"];
  label?: string;
  required?: InputProps["required"];
  onChange?: InputProps["onChange"];
  value?: InputProps["value"];
}

interface Option {
  label: string;
  value: InputProps["value"];
}
