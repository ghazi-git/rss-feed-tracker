import pkg from "../../../../package.json";
import styles from "./ExtensionVersion.module.css";

export default function ExtensionVersion() {
  const version = () => (import.meta.env.DEV ? "DEV" : `v${pkg.version}`);

  return (
    <div class={styles.version}>
      <a
        href="https://github.com/ghazi-git/rss-feed-tracker/releases"
        title="https://github.com/ghazi-git/rss-feed-tracker/releases"
        target="_blank"
      >
        {version()}
      </a>
      <a
        href="https://github.com/ghazi-git/rss-feed-tracker/issues"
        title="https://github.com/ghazi-git/rss-feed-tracker/issues"
        target="_blank"
      >
        (Report an issue)
      </a>
    </div>
  );
}
