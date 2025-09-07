import { useNavigate, useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/PageHeader.jsx";
import FeedForm from "@/popup/pages/add-edit-feed/FeedForm.jsx";

export default function AddFeed() {
  const navigate = useNavigate();
  const [formdata, setFormdata] = createStore({
    url: "",
    name: "",
    frequency: 2 * 60 * 60 * 1000,
    folder: "",
  });
  const [searchParams] = useSearchParams();
  return (
    <>
      <PageHeader
        text="Add Feed"
        previousUrl={searchParams.previousUrl ?? "/home"}
      />
      <FeedForm
        onSubmit={(event) => {
          event.preventDefault();
          console.log("formdata", formdata);
          navigate("/home");
        }}
        formdata={formdata}
        setFormdata={setFormdata}
      />
    </>
  );
}
