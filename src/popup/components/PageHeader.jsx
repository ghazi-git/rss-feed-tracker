import BackLink from "@/popup/components/BackLink.jsx";
import PageHeaderWrapper from "@/popup/components/PageHeaderWrapper.jsx";

export default function PageHeader(props) {
  return (
    <PageHeaderWrapper>
      <BackLink url={props.previousUrl} />
      <h2>{props.text}</h2>
    </PageHeaderWrapper>
  );
}
