import { useDropdownContext } from "@/popup/components/dropdown/context.jsx";
import TriangleIcon from "@/popup/components/svg-icons/TriangleIcon.jsx";

export default function MenuStateIndicator(props) {
  const { store } = useDropdownContext();

  return <TriangleIcon orientation={store.open ? "up" : "down"} {...props} />;
}
