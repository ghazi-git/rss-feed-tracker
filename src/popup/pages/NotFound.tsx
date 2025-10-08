import { useSearchParams } from "@solidjs/router";

import Anchor from "@/popup/components/Anchor";

import styles from "./NotFound.module.css";

export default function NotFound() {
  const [searchParams] = useSearchParams();
  const defaultMsg = "What you're looking for may have been moved or deleted.";

  return (
    <div class={styles["not-found"]}>
      <h2>404 Not Found</h2>
      <p>{searchParams.msg || defaultMsg}</p>
      <Anchor href="/library" replace={true} class="btn">
        Go back to Library
      </Anchor>
    </div>
  );
}
