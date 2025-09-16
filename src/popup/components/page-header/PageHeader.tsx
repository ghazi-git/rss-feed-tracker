import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PageTitle from "@/popup/components/page-header/PageTitle";

export default function PageHeader(props: PageHeaderProps) {
  return (
    <PageHeaderWrapper>
      <BackLink url={props.previousUrl} />
      <PageTitle title={props.text} />
    </PageHeaderWrapper>
  );
}

interface PageHeaderProps {
  previousUrl: string;
  text: string;
}
