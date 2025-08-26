import { splitProps } from "solid-js";

import { FieldWrapper } from "@/popup/components/forms/FieldWrapper.jsx";
import { setId } from "@/popup/components/forms/utils.js";

import styles from "./Input.module.css";

export default function InputField(props) {
  const propsWithId = setId(props);

  return (
    <FieldWrapper
      label={propsWithId.label}
      labelFor={propsWithId.id}
      required={propsWithId.required}
    >
      <Input {...propsWithId} />
    </FieldWrapper>
  );
}

function Input(props) {
  const [extra, inputProps] = splitProps(props, ["label", "class"]);

  return (
    <input class={`${styles.input} ${extra.class ?? ""}`} {...inputProps} />
  );
}
