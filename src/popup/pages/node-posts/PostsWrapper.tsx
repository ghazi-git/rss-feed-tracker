import { JSX, splitProps } from "solid-js";

import styles from "./PostsWrapper.module.css";

export default function PostsWrapper(props: PostsWrapperProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div class={`${styles.posts} ${local.class ?? ""}`} role="list" {...rest} />
  );
}

type PostsWrapperProps = JSX.HTMLAttributes<HTMLDivElement>;
