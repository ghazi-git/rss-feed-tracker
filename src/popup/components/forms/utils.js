import { mergeProps } from "solid-js";

export function setId(props) {
  // generate the id automatically if not provided while accounting for props
  // passed as signals
  const idObj = {};
  Object.defineProperty(idObj, "id", {
    get() {
      return props.id ?? `id_${props.name}`;
    },
  });
  const allProps = mergeProps(props, idObj);
  return allProps;
}
