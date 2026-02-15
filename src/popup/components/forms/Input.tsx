import { JSX, Show, splitProps } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper";
import { addDefaultId } from "@/popup/components/forms/utils";

import styles from "./Input.module.css";

export default function InputField(props: InputProps) {
  const propsWithId = addDefaultId(props);

  return (
    <FieldWrapper
      label={propsWithId.label}
      labelFor={propsWithId.id}
      required={propsWithId.required}
    >
      <Input {...propsWithId} />
      <Show when={propsWithId.helpText}>
        <div class={styles["help-text"]}>{propsWithId.helpText}</div>
      </Show>
    </FieldWrapper>
  );
}

export function Input(props: InputProps) {
  const [extra, inputProps] = splitProps(props, ["label", "class"]);

  return (
    <input class={`${styles.input} ${extra.class ?? ""}`} {...inputProps} />
  );
}

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helpText?: string;
}
