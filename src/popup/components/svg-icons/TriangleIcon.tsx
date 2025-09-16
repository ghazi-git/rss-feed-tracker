import { splitProps } from "solid-js";

import styles from "./TriangleIcon.module.css";
import { SVGProps } from "@/popup/components/svg-icons/types";

export default function TriangleIcon(props: TriangleIconProps) {
  const [extra, rest] = splitProps(props, ["class"]);
  const orientation = () => props.orientation ?? "down";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 286 252"
      fill="currentCOlor"
      stroke="currentColor"
      class={`${styles.triangle} ${orientation() === "up" ? styles.up : ""} ${extra.class ?? ""}`}
      {...rest}
    >
      <path
        d="M186.478 208.19C165.942 239.49 120.058 239.49 99.5225 208.19L28.8848 100.525C6.19707 65.9447 31.0044 20 72.3633 20L213.637 20C254.996 20 279.803 65.9447 257.115 100.525L186.478 208.19Z"
        stroke-width="30"
        stroke-linejoin="round"
      />
    </svg>
  );
}

interface TriangleIconProps extends SVGProps {
  orientation?: "up" | "down";
}
