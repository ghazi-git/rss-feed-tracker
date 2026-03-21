import styles from "./UnreadToggle.module.css";

export default function UnreadToggle(props: UnreadToggleProps) {
  return (
    <div class={styles["unread-toggle"]}>
      <div
        class={props.unread ? styles.unread : styles.read}
        onClick={async (event) => {
          await props.onToggleUnread(event);
        }}
        onKeyDown={async (event) => {
          if (event.key === "Enter") {
            await props.onToggleUnread(event);
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onAuxClick={(event) => {
          if (event.button === 1) {
            // middle mouse btn click
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        title={props.unread ? "Mark as read" : "Mark as unread"}
        role="button"
        tabindex={props.tabindex}
      />
    </div>
  );
}

interface UnreadToggleProps {
  unread: boolean;
  onToggleUnread: (event: Event) => Promise<void>;
  tabindex: number;
}
