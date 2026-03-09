import { ErrorBoundary, FlowProps } from "solid-js";

import styles from "./FilterErrorBoundary.module.css";

export default function FilterErrorBoundary(props: FlowProps) {
  return (
    <ErrorBoundary
      fallback={(err) => (
        <div class={styles.error}>
          {err.message || "An unexpected error happened."}
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}
