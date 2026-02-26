import { parseFeed } from "feedsmith";
import type { Atom, Json, Rss } from "feedsmith/types";

import { FeedParseError, HttpError } from "@/background/utils/errors";
import { Post } from "@/db-setup";
import { getLogger, glogger, Logger } from "@/utils/logging";
import { retry } from "@/utils/retry-on-error";

export async function fetchAndParseFeed(
  url: string,
  logger: Logger | null = null,
) {
  logger = logger ?? getLogger({ action: "load-and-parse-feeds" });
  logger.debug(`fetching...`, { url });
  const feedContent = await fetchFeedContent(url);
  logger.debug("parsing feed...");
  return parseFeedContent(url, feedContent);
}

/**
 * fetch the feed xml from its remote source
 * @raises HttpError, TimeoutError
 */
async function fetchFeedContent(url: string, timeout = 10_000) {
  return await retry(async () => {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!response.ok) {
      const msg = `Unable to get the feed data. Please make sure the URL is \
        the correct and the server is reachable.`;
      throw new HttpError(msg, {
        cause: `status=${response.status} statusText=${response.statusText}`,
      });
    }

    return await response.text();
  });
}

/**
 * parse the feed xml into unified json format. Handles the RSS, Atom and json
 * feed formats.
 * @raises FeedParseError
 */
function parseFeedContent(feedURL: string, feedContent: string): ParsedFeed {
  try {
    const { format, feed } = parseFeed(feedContent);
    if (format === "rss") {
      return getRSSFeedContent(feed as Rss.Feed<string>, feedURL);
    } else if (format === "atom") {
      return getAtomFeedContent(feed as Atom.Feed<string>, feedURL);
    } else if (format === "json") {
      return getJSONFeedContent(feed as Json.Feed<string>, feedURL);
    } else {
      throw new FeedParseError("Unsupported feed format.");
    }
  } catch (e) {
    if (e instanceof FeedParseError) throw e;

    throw new FeedParseError("Unable to parse the feed.", { cause: e });
  }
}

function getRSSFeedContent(
  feed: Rss.Feed<string>,
  feedURL: string,
): ParsedFeed {
  const items = feed.items ?? [];
  const posts: ParsedPost[] = [];
  for (const item of items) {
    const guid = item.guid?.value || item.link;
    if (!guid) {
      glogger.debug("No GUID - Ignoring item", {
        action: "parse-rss-feed",
        feedURL,
      });
      continue;
    }

    // defaulting to the guid is according to the spec
    // https://www.rssboard.org/rss-specification#ltguidgtSubelementOfLtitemgt
    let url = item.link || (item.guid?.isPermaLink ? item.guid?.value : null);
    if (!url) {
      // Some RSS feed items might use enclosure to provide a URL to an
      // audio/video file. Podcasts sometimes do that (like techmeme ride
      // home or syntaxFM).
      // The main idea is to always have a URL for the item. Even if an
      // enclosure is not found, we'll default to the feed website or the
      // RSS feed URL. Then, the user can still see the new item and go to
      // the website to see what it actually is
      url = getRSSItemURLFromEnclosure(item.enclosures) ?? feed.link ?? feedURL;
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
  feed: Atom.Feed<string>,
  feedURL: string,
): ParsedFeed {
  const items = feed.entries ?? [];
  const posts: ParsedPost[] = [];
  const websiteURL = getAtomFeedWebsite(feed.links);
  for (const item of items) {
    const guid = item.id;
    const url = getAtomEntryURL(item.links) ?? websiteURL ?? feedURL;

    const title = item.title || url;
    const publishedAt =
      getTimestamp(item.published) || getTimestamp(item.updated) || Date.now();
    posts.push({ guid, url, title, publishedAt, commentsURL: null });
  }

  return {
    name: feed.title,
    favicon: getFaviconURL(websiteURL),
    url: feedURL,
    posts: posts,
  };
}

function getJSONFeedContent(
  feed: Json.Feed<string>,
  feedURL: string,
): ParsedFeed {
  const posts: ParsedPost[] = [];
  for (const item of feed.items) {
    const guid = item.id;
    let url = item.url || item.id;
    if (!URL.parse(url)) {
      // check if there's an audio/video link in attachments
      url =
        getJSONFeedItemURLFromAttachments(item.attachments) ??
        feed.home_page_url ??
        feedURL;
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

function getRSSItemURLFromEnclosure(enclosures: Rss.Enclosure[] | undefined) {
  if (!enclosures) return undefined;

  const audio = enclosures.find(
    (e) => e.type?.startsWith("audio/") && URL.parse(e.url),
  );
  if (audio) return audio.url;

  const video = enclosures.find(
    (e) => e.type?.startsWith("video/") && URL.parse(e.url),
  );
  if (video) return video.url;
}

function getAtomEntryURL(links: Atom.Link<string>[] | undefined) {
  if (!links) return undefined;

  // refer to https://validator.w3.org/feed/docs/atom.html#link
  const link = links.find(
    // account for relative URLs by adding the feed URL as base
    (l) => (!l.rel || l.rel === "alternate") && URL.parse(l.href),
  );
  if (link) return link.href;

  // if no link, then check if there's a URL for an audio or video file
  const audio = links.find(
    (link) =>
      link.rel === "enclosure" &&
      link.type?.startsWith("audio/") &&
      URL.parse(link.href),
  );
  if (audio) return audio.href;

  const video = links.find(
    (link) =>
      link.rel === "enclosure" &&
      link.type?.startsWith("video/") &&
      URL.parse(link.href),
  );
  if (video) return video.href;
}

function getAtomFeedWebsite(links: Atom.Link<string>[] | undefined) {
  // refer to https://validator.w3.org/feed/docs/atom.html#link
  const urls = (links || []).filter(
    (link) => !link.rel || link.rel === "alternate",
  );
  if (urls.length) {
    const url = URL.parse(urls[0].href);
    return url?.href;
  }
}

function getJSONFeedItemURLFromAttachments(
  attachments: Json.Attachment[] | undefined,
) {
  if (!attachments) return undefined;

  const audio = attachments.find(
    (a) => a.mime_type?.startsWith("audio/") && URL.parse(a.url),
  );
  if (audio) return audio.url;

  const video = attachments.find(
    (a) => a.mime_type?.startsWith("video/") && URL.parse(a.url),
  );
  if (video) return video.url;
}

export function getPostObjects(
  parsedPosts: ParsedPost[],
  feedId: number,
  fetchTime: number,
) {
  return parsedPosts.map((post) => ({
    ...post,
    unread: 1,
    bookmarked: 0,
    feedId,
    receivedAt: fetchTime,
  })) as Post[];
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
