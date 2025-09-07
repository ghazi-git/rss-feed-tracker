import { singleLineEllipsis } from "@/popup/directives/ellipsis.js";

export default function NodeName(props) {
  return (
    <span use:singleLineEllipsis={props.name} dir="auto">
      {props.name}
    </span>
  );
}
