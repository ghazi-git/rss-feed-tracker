import { singleLineEllipsis } from "@/popup/directives/ellipsis";

export default function NodeName(props: { name: string }) {
  return (
    <span use:singleLineEllipsis={props.name} dir="auto">
      {props.name}
    </span>
  );
}
