import { MergeProps, mergeProps } from "solid-js";

export function addDefaultId<T extends { name: string }>(
  props: T,
): MergeProps<[{ id: string }, T]> {
  // generate the id automatically if not provided while accounting for props
  // passed as signals
  const idObj = {
    get id() {
      return `id_${props.name}`;
    },
  };
  const allProps = mergeProps(idObj, props);
  return allProps;
}
