import { useNavigate, useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/page-header/PageHeader.jsx";
import FeedForm from "@/popup/pages/add-edit-feed/FeedForm.jsx";

export default function AddFeed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formdata, setFormdata] = createStore({
    url: "",
    name: "",
    frequency: 2 * 60 * 60 * 1000,
    folder: parseInt(searchParams.parentFolderId) || null,
  });

  return (
    <>
      <PageHeader
        text="Add Feed"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <FeedForm
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
          navigate("/library");
        }}
        formdata={formdata}
        setFormdata={setFormdata}
      />
    </>
  );
}
