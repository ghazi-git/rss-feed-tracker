import { SVGProps } from "@/popup/components/svg-icons/types";

import styles from "./LoadingIcon.module.css";

export default function LoadingIcon(props: SVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-16 -16 32 32"
      fill="currentColor"
      {...props}
    >
      <g class={styles.spinner}>
        <circle cx="8.5" cy="8.5" r="1.2" />
        <circle cx="0" cy="12" r="1.4" />
        <circle cx="-8.5" cy="8.5" r="1.6" />
        <circle cx="-12" cy="0" r="1.8" />
        <circle cx="-8.5" cy="-8.5" r="2" />
        <circle cx="0" cy="-12" r="2.2" />
        <circle cx="8.5" cy="-8.5" r="2.4" />
      </g>
    </svg>
  );
}
