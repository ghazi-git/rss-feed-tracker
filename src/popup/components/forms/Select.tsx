import { For, JSX, splitProps } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper";
import { addDefaultId } from "@/popup/components/forms/utils";

import styles from "./Select.module.css";

export default function SelectField(props: SelectProps) {
  const propsWithId = addDefaultId(props);
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
        <button>
          {/* @ts-expect-error tag available in chrome since v135 */}
          <selectedcontent />
        </button>
        <For each={extra.options}>
          {({ label, value, ...rest }) => (
            <option
              value={value ?? ""}
              selected={value === extra.value}
              {...rest}
            >
              {label}
            </option>
          )}
        </For>
      </select>
    </FieldWrapper>
  );
}

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  options: SelectOption[];
  value?: OptionProps["value"];
  label?: string;
}

export interface SelectOption {
  label: OptionProps["label"];
  value: OptionProps["value"];
  disabled?: OptionProps["disabled"];
}

type OptionProps = JSX.OptionHTMLAttributes<HTMLOptionElement>;
