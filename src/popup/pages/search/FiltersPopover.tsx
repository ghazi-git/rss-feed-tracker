import { FlowProps } from "solid-js";

import styles from "./FiltersPopover.module.css";

export default function FiltersPopover(props: FiltersPopoverProps) {
  let popover!: HTMLDivElement;

  return (
    <div
      ref={popover}
      class={styles.popover}
      id={props.id}
      popover
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          // prevent closing the extension popup and close only the popup
          e.preventDefault();
          popover.hidePopover();
        }
      }}
    >
      {props.children}
    </div>
  );
}

interface FiltersPopoverProps extends FlowProps {
  id: string;
}
