import { createStore } from "solid-js/store";

const [preview, setPreview] = createStore({
  url: "",
  show: false,
});

let hideTimerId;

function showLinkPreview(url) {
  if (hideTimerId) clearTimeout(hideTimerId);

  setPreview({ url, show: true });
}

function hideLinkPreview() {
  if (preview.show) {
    hideTimerId = setTimeout(() => {
      setPreview("show", false);
    }, 300);
  }
}

export { hideLinkPreview, preview, showLinkPreview };
