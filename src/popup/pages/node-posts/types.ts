import { Post } from "@/popup/utils/dummy-data";

export interface PostType extends Post {
  feed: { name: string; favicon: string | null };
}
