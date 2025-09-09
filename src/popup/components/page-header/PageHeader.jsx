import BackLink from "@/popup/components/page-header/BackLink.jsx";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper.jsx";
import PageTitle from "@/popup/components/page-header/PageTitle.jsx";

export default function PageHeader(props) {
  return (
    <PageHeaderWrapper>
      <BackLink url={props.previousUrl} />
      <PageTitle title={props.text} />
    </PageHeaderWrapper>
  );
}
