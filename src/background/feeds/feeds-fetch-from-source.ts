import type { AtomFeed, JsonFeed, RssFeed } from "feedsmith";
import { parseFeed } from "feedsmith";

import { FeedParseError, HttpError } from "@/background/utils/errors";
import { retry } from "@/background/utils/retry-on-error";

/**
 * fetch the feed xml from its remote source
 * @raises HttpError
 */
export async function fetchFeedContent(url: string) {
  return await retry(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      const msg = `Unable to get the feed data. Please make sure the URL is \
        the correct and the server is reachable.`;
      throw new HttpError(msg);
    }

    return await response.text();
  });
}

/**
 * parse the feed xml into unified json format. Handles the RSS, Atom and json
 * feed formats.
 * @raises FeedParseError
 */
export function parseFeedContent(
  feedURL: string,
  feedContent: string,
): ParsedFeed {
  try {
    const { format, feed } = parseFeed(feedContent);
    if (format === "rss") {
      return getRSSFeedContent(feed as RssFeed<string>, feedURL);
    } else if (format === "atom") {
      return getAtomFeedContent(feed as AtomFeed<string>, feedURL);
    } else if (format === "json") {
      return getJSONFeedContent(feed as JsonFeed<string>, feedURL);
    } else {
      throw new FeedParseError("Unsupported feed format.");
    }
  } catch (e) {
    console.error("feed-parsing: failure", e);
    if (e instanceof FeedParseError) throw e;

    throw new FeedParseError("Unable to parse the feed.", { cause: e });
  }
}

function getRSSFeedContent(feed: RssFeed<string>, feedURL: string): ParsedFeed {
  const items = feed.items ?? [];
  const posts: ParsedPost[] = [];
  for (const item of items) {
    const guid = item.guid?.value || item.link;
    if (!guid) {
      const msg = `Processing RSS Feed ${feedURL} - No GUID - Ignoring item`;
      console.debug(msg, item);
      continue;
    }

    // defaulting to the guid is according to the spec
    // https://www.rssboard.org/rss-specification#ltguidgtSubelementOfLtitemgt
    const url = item.link || (item.guid?.isPermaLink ? item.guid?.value : null);
    if (!url) {
      const msg = `Processing RSS Feed ${feedURL} - No URL - Ignoring item`;
      console.debug(msg, item);
      continue;
    }

    const title = item.title || truncateText(item.description) || url;
    const publishedAt = getTimestamp(item.pubDate) || Date.now();
    const commentsURL = item.comments || null;
    posts.push({ guid, url, title, publishedAt, commentsURL });
  }
  return {
    name: feed.title,
    favicon: getFaviconURL(feed.link),
    url: feedURL,
    posts: posts,
  };
}

function getAtomFeedContent(
  feed: AtomFeed<string>,
  feedURL: string,
): ParsedFeed {
  const items = feed.entries ?? [];
  const posts: ParsedPost[] = [];
  for (const item of items) {
    const guid = item.id;
    const url = getAtomEntryURL(item.links, feedURL);
    if (!url) {
      const msg = `Processing Atom Feed ${feedURL} - No URL - Ignoring item`;
      console.debug(msg, item);
      continue;
    }

    const title = item.title || url;
    const publishedAt =
      getTimestamp(item.published) || getTimestamp(item.updated) || Date.now();
    posts.push({ guid, url, title, publishedAt, commentsURL: null });
  }

  const websiteURL = getAtomFeedWebsite(feed.links);
  return {
    name: feed.title,
    favicon: getFaviconURL(websiteURL),
    url: feedURL,
    posts: posts,
  };
}

function getJSONFeedContent(
  feed: JsonFeed<string>,
  feedURL: string,
): ParsedFeed {
  const posts: ParsedPost[] = [];
  for (const item of feed.items) {
    const guid = item.id;
    const url = item.url || item.id;
    if (!URL.parse(url)) {
      const msg = `Processing JSON Feed ${feedURL} - No URL - Ignoring item`;
      console.debug(msg, item);
      continue;
    }

    const title = item.title || truncateText(item.content_text) || url;
    const publishedAt =
      getTimestamp(item.date_published) ||
      getTimestamp(item.date_modified) ||
      Date.now();
    posts.push({ guid, url, title, publishedAt, commentsURL: null });
  }
  return {
    name: feed.title,
    favicon: getFaviconURL(feed.home_page_url),
    url: feedURL,
    posts: posts,
  };
}

function getFaviconURL(website: string | undefined) {
  const url = URL.parse(website ?? "");
  if (!url) return null;

  // there is also https://icons.duckduckgo.com/ip3/<hostname>.ico
  return `https://www.google.com/s2/favicons?domain=${url.hostname}`;
}

function truncateText(text: string | undefined) {
  if (text) {
    return text.length > 303 ? `${text.slice(0, 300)}...` : text;
  }
  return null;
}

function getTimestamp(value: string | undefined) {
  const dt = new Date(value ?? "");
  return dt.getTime() || null;
}

function getAtomEntryURL(links: AtomFeed<string>["links"], feedURL: string) {
  // refer to https://validator.w3.org/feed/docs/atom.html#link
  const urls = (links || []).filter(
    (link) => !link.rel || link.rel === "alternate",
  );
  if (urls.length) {
    // account for relative URLs by adding the feed URL as base
    const url = URL.parse(urls[0].href, feedURL);
    return url?.href || null;
  }
  return null;
}

function getAtomFeedWebsite(links: AtomFeed<string>["links"]) {
  // refer to https://validator.w3.org/feed/docs/atom.html#link
  const urls = (links || []).filter(
    (link) => !link.rel || link.rel === "alternate",
  );
  if (urls.length) {
    const url = URL.parse(urls[0].href);
    return url?.href;
  }
}

interface ParsedFeed {
  name: string;
  favicon: string | null;
  url: string;
  posts: ParsedPost[];
}

export interface ParsedPost {
  guid: string;
  title: string;
  url: string;
  publishedAt: number;
  commentsURL: string | null;
}
