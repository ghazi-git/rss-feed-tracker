import { singleLineEllipsis } from "@/popup/directives/ellipsis";

export default function SingleLineText(props: SingleLineTextProps) {
  return (
    <div
      class={props.class ?? ""}
      dir="auto"
      use:singleLineEllipsis={props.text}
    >
      {props.text}
    </div>
  );
}

interface SingleLineTextProps {
  text: string;
  class?: string;
}
