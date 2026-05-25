import type { DiscoverResult } from "feedscout";
import { discoverFeeds } from "feedscout";
import type { FeedResult } from "feedscout/feeds";
import { parseFeed } from "feedsmith";

import { FindFeedError } from "@/background/utils/errors";
import { getDBConnection } from "@/db-setup";
import { FeedFound } from "@/messaging-wrapper";
import { glogger } from "@/utils/logging";

export async function findFeeds(): Promise<FeedFound[]> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  if (!currentTab?.url || !currentTab?.id) {
    // happens when opening the current tab is a chrome restricted pages
    // like new tab
    throw new FindFeedError(
      "Unable to find feeds in the currently active browser tab.",
    );
  }

  const { id: tabId, url: tabURL } = currentTab;

  // Check if this is a feed link first. The reason we're fetching the html
  // is that chrome (or other extensions) "pretty-render" the feed XML making
  // it an unparsable feed
  const html = await fetchHTML(tabURL);
  if (html) {
    const feed = parseAsFeed(html);
    if (feed) {
      const existingFeedURLs = await getExistingFeedURLs();
      return [
        {
          url: tabURL,
          title: feed.title,
          description: feed.description,
          subscribed: existingFeedURLs.has(tabURL),
        },
      ];
    }
  }

  const feeds = await findFeedsByURL(tabURL, html);
  if (feeds.length) return feeds;

  return await findFeedsInCurrentTab(tabId, tabURL);
}

async function getExistingFeedURLs() {
  using conn = await getDBConnection();
  const nodes = await conn.db.getAllFromIndex("nodes", "by_type", "feed");
  const urls = nodes.filter((n) => n.type === "feed").map((n) => n.feed.url);
  return new Set(urls);
}

async function fetchHTML(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    if (response.ok) return await response.text();
  } catch (e) {
    glogger.error(`find-feeds: failure to fetch HTML url=${url}`, e);
  }

  return null;
}

function parseAsFeed(html: string) {
  try {
    const { format, feed } = parseFeed(html);
    const description = format === "atom" ? feed.subtitle : feed.description;
    return {
      title: feed.title || "No Title Found",
      description: description || "No description found.",
    };
  } catch {}
  return null;
}

/**
 * feedscout can find the RSS based on the URL. This is possible for a fixed
 * number of sites (youtube, reddit, ...)
 * https://feedscout.dev/feeds/platform#supported-platforms
 */
async function findFeedsByURL(tabURL: string, html: string | null) {
  const content =
    html ??
    "Could not fetch the html, that means platform handlers needing it will not succeed.";
  try {
    const results = await discoverFeeds(
      { url: tabURL, content },
      { methods: ["platform"], concurrency: 5 },
    );
    return await getFeedsFromResults(results);
  } catch (e) {
    glogger.error("find-feeds: failure when finding based on URL", e);
  }

  return [];
}

async function getFeedsFromResults(results: DiscoverResult<FeedResult>[]) {
  const existingFeedURLs = await getExistingFeedURLs();
  return results
    .filter((res) => res.isValid)
    .filter((res) => ["rss", "atom", "json"].includes(res.format))
    .map((feed) => ({
      url: feed.url,
      title: feed.title || "No Title Found",
      description: feed.description || "No description found.",
      subscribed: existingFeedURLs.has(feed.url),
    }));
}

async function findFeedsInCurrentTab(
  tabId: number,
  tabURL: string,
): Promise<FeedFound[]> {
  // get the link and anchor tags from the page directly, that is better than
  // the fetched HTML, especially for JS-based sites (like SPA)
  const outputs = await chrome.scripting.executeScript({
    injectImmediately: true,
    target: { tabId },
    func: getAnchorsAndLinks,
  });
  const htmlLinksAnchors = outputs[0]?.result;
  if (htmlLinksAnchors) {
    try {
      const results = await discoverFeeds(
        { url: tabURL, content: htmlLinksAnchors },
        { methods: ["html"], concurrency: 5 },
      );
      return await getFeedsFromResults(results);
    } catch (e) {
      glogger.error("find-feeds: failure when finding URLs in current tab", e);
    }
  }
  return [];
}

/**
 * This function is injected as a content script, so it must not reference
 * anything from outside its scope. It returns anchors and links only because
 * that what feedscout inspects to find RSS Feed URLs. Returning all the page's
 * html easily means returning megabytes of data which we're trying to avoid
 */
function getAnchorsAndLinks() {
  const links = document.querySelectorAll("link");
  const anchors = document.querySelectorAll("a");
  if (!links.length && !anchors.length) return null;

  const linksHTML = Array.from(links).map((elt) => elt.outerHTML);
  const anchorsHTML = Array.from(anchors).map((elt) => elt.outerHTML);

  return `
  <html>
    <head>${linksHTML.join("\n")}</head>
    <body>${anchorsHTML.join("\n")}</body>
  </html>`;
}
