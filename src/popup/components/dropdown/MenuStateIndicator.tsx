import { useDropdownContext } from "@/popup/components/dropdown/context";
import TriangleIcon from "@/popup/components/svg-icons/TriangleIcon.js";
import { SVGProps } from "@/popup/components/svg-icons/types";

export default function MenuStateIndicator(props: SVGProps) {
  const { store } = useDropdownContext();

  return <TriangleIcon orientation={store.open ? "up" : "down"} {...props} />;
}
