import { useNavigate, useSearchParams } from "@solidjs/router";
import { onMount } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";

import styles from "./Library.module.css";

export default function Library() {
  const navigate = useNavigate();
  // forward focusedIndex
  const [searchParams] = useSearchParams<{ focusedIndex?: string }>();
  const search = () =>
    searchParams.focusedIndex
      ? `?focusedIndex=${searchParams.focusedIndex}`
      : "";
  onMount(async () => {
    const resp = await sendMessage("folders/get-root", undefined);
    if (resp.success && resp.data.hasChildNodes) {
      navigate(`/library/nodes/${resp.data.id}${search()}`, { replace: true });
    } else {
      navigate("/library/no-feeds-yet", { replace: true });
    }
  });

  return (
    <div class={styles.spinner}>
      <LoadingIcon />
      <div>Loading feeds and folders...</div>
    </div>
  );
}
