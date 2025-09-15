import { SVGProps } from "@/popup/components/svg-icons/types";

export default function PreviousIcon(props: SVGProps) {
  return (
    <svg
      viewBox="0 0 90 74"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M85 42C87.7614 42 90 39.7614 90 37C90 34.2386 87.7614 32 85 32L85 37L85 42ZM1.46447 33.4645C-0.488156 35.4171 -0.488155 38.5829 1.46447 40.5355L33.2843 72.3553C35.2369 74.308 38.4027 74.308 40.3553 72.3553C42.308 70.4027 42.308 67.2369 40.3553 65.2843L12.0711 37L40.3553 8.71573C42.308 6.76311 42.308 3.59729 40.3553 1.64466C38.4027 -0.307956 35.2369 -0.307956 33.2843 1.64467L1.46447 33.4645ZM85 37L85 32L5 32L5 37L5 42L85 42L85 37Z" />
    </svg>
  );
}
