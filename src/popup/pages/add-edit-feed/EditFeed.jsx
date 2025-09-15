import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";

import PageHeader from "@/popup/components/page-header/PageHeader";
import FeedForm from "@/popup/pages/add-edit-feed/FeedForm.jsx";
import { NODES } from "@/popup/utils/dummy-data";

export default function EditFeed() {
  const navigate = useNavigate();
  const [formdata, setFormdata] = createStore({
    url: "",
    name: "",
    frequency: 2 * 60 * 60 * 1000,
    folder: "",
  });
  const [searchParams] = useSearchParams();
  const params = useParams();
  createEffect(() => {
    const node = NODES.find((n) => n.id === parseInt(params.id));
    if (node) {
      setFormdata({
        url: node.feed.url,
        name: node.name,
        frequency: node.feed.updateFrequency,
        folder: node.parentId,
      });
    }
  });

  return (
    <>
      <PageHeader
        text="Edit Feed"
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
