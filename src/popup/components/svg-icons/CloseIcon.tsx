import { SVGProps } from "@/popup/components/svg-icons/types";

export default function CloseIcon(props: SVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
        stroke-width="2"
        stroke-linecap="round"
      />
      <line
        x1="6"
        y1="18"
        x2="18"
        y2="6"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
}
