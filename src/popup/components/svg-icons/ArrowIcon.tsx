import { splitProps } from "solid-js";

import { SVGProps } from "@/popup/components/svg-icons/types";

import styles from "./ArrowIcon.module.css";

export default function ArrowIcon(props: ArrowIconProps) {
  const [extra, rest] = splitProps(props, ["class"]);
  const orientation = () => props.orientation ?? "down";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="1.5"
      stroke="currentColor"
      class={`${orientation() === "up" ? styles.up : ""} ${extra.class ?? ""}`}
      {...rest}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
      />
    </svg>
  );
}

interface ArrowIconProps extends SVGProps {
  orientation?: "up" | "down";
}
