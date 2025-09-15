import { singleLineEllipsis } from "@/popup/directives/ellipsis";

export default function PageTitle(props: { title: string }) {
  return (
    <h2 use:singleLineEllipsis={props.title} dir="auto">
      {props.title}
    </h2>
  );
}
