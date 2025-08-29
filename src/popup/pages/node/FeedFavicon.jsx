import { createSignal, Show } from "solid-js";

import styles from "./FeedFavicon.module.css";

export default function FeedFavicon(props) {
  // show fallback until the favicon loads successfully. This avoids any layout
  // shift since we always have sth to show.
  const [showFallback, setShowFallback] = createSignal(true);
  // hide the favicon img tag if the favicon fails to load. This avoids the alt
  // value being displayed when img load fails.
  const [hideImg, setHideImg] = createSignal(false);

  return (
    <div class={styles.favicon}>
      <Show when={showFallback()}>
        <DefaultFavicon name={props.name} />
      </Show>
      <Show when={props.favicon && !hideImg()}>
        <img
          src={props.favicon}
          onLoad={() => setShowFallback(false)}
          onError={() => setHideImg(true)}
          alt="icon"
        />
      </Show>
    </div>
  );
}

function DefaultFavicon(props) {
  return <div class={styles["default-favicon"]}>{props.name[0]}</div>;
}
