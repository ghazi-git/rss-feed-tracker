import { Document, Encoder, IndexedDB } from "flexsearch";

const ID_SEPARATOR = "||";
export function getIndexedPostID(feedId: number, guid: string) {
  return `${feedId}${ID_SEPARATOR}${guid}`;
}

export function getPostID(indexedPostID: string) {
  const idx = indexedPostID.indexOf(ID_SEPARATOR);
  if (idx >= 0) {
    const prefix = indexedPostID.slice(0, idx);
    const suffix = indexedPostID.slice(idx + ID_SEPARATOR.length);
    const feedId = parseInt(prefix);
    if (!isNaN(feedId) && suffix) {
      return { feedId, guid: suffix };
    }
  }
  return null;
}

export async function getSearchIndex(indexName: string) {
  const encoder = getSearchEncoder();
  const index = new Document<IndexedPost, false, IndexedDB>({
    commit: false,
    document: {
      id: "id",
      store: ["feedId", "bookmarked"],
      index: [{ field: "title", encoder: encoder, tokenize: "full" }],
    },
  });
  const db = new IndexedDB(indexName);
  await index.mount(db);
  return index;
}

export type IndexedPost = {
  // feedId followed by 2 pipes `||` then the guid `<feedId>||<guid>` since
  // flexsearch allow only for one property to be the document id
  id: string;
  // title is the only searchable property in the post
  title: string;
  // used for filtering after the search is done
  feedId: number;
  bookmarked: 0 | 1;
};

export function getSearchEncoder() {
  return new Encoder({
    // remove accents and convert to lowercase
    normalize: true,
    // dedupe false to avoid potential issue with highlighting
    // https://github.com/nextapps-de/flexsearch/issues/514#issuecomment-3263606047
    dedupe: false,
    cache: true,
    include: {
      letter: true,
      number: true,
      symbol: false,
      punctuation: false,
      control: false,
      char: "",
    },
  });
}
