import { singleLineEllipsis } from "@/popup/directives/ellipsis";

export default function NodeName(props) {
  return (
    <span use:singleLineEllipsis={props.name} dir="auto">
      {props.name}
    </span>
  );
}
