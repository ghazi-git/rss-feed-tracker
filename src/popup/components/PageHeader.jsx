import BackLink from "@/popup/components/BackLink.jsx";
import PageHeaderWrapper from "@/popup/components/PageHeaderWrapper.jsx";
import PageTitle from "@/popup/components/PageTitle.jsx";

export default function PageHeader(props) {
  return (
    <PageHeaderWrapper>
      <BackLink url={props.previousUrl} />
      <PageTitle title={props.text} />
    </PageHeaderWrapper>
  );
}
