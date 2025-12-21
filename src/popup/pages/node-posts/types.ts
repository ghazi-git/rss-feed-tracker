import { Post } from "@/background/db-setup";

export interface PostType extends Post {
  feed: { name: string; favicon: string | null };
}
