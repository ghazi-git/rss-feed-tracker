import { setId } from "@/popup/components/forms/utils.js";

import styles from "./Checkbox.module.css";

export default function Checkbox(props) {
  const propsWithId = setId(props);

  return (
    <div class={styles["field-wrapper"]}>
      <label for={propsWithId.id}>
        <input
          type="checkbox"
          checked={props.value ? "checked" : false}
          {...propsWithId}
        />
        <span>{propsWithId.label}</span>
      </label>
    </div>
  );
}
