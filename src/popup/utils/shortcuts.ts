import { useNavigate, useSearchParams } from "@solidjs/router";
import hotkeys from "hotkeys-js";
import { Accessor, onCleanup, onMount } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import { notifyError, notifyInfo } from "@/popup/utils/notifications";
import { openTab, openWindow } from "@/popup/utils/urls";
import { glogger } from "@/utils/logging";

hotkeys.filter = (event: KeyboardEvent) => {
  // allow shortcuts using the ctrl key even from within form fields
  // mainly for moving between filter (ctrl+f) and search (ctrl+shift+f) pages
  // while preserving the query, but the behavior is still useful even for
  // other ctrl-based shortcuts.
  // Escape is allowed to exist filter/search pages event when the focus is
  // inside the filter/search input.
  if (event.ctrlKey || event.key === "Escape") return true;

  return enableShortcut(event);
};

export function handleSearchShortcut(onShortcutTriggered: () => void) {
  createShortcut("ctrl+shift+f", () => onShortcutTriggered());
}

export function handleFilterShortcut(onShortcutTriggered: () => void) {
  createShortcut("ctrl+f", () => onShortcutTriggered());
}

export function handleExitFilterShortcut() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  createShortcut("escape", () => {
    navigate(searchParams.previousUrl ?? "/library");
  });
}

export function createPostLinkShortcuts(
  posts: Accessor<FeedPost[]>,
  focusedIndex: Accessor<number | null>,
) {
  createShortcut("ctrl+shift+enter", () => {
    const post = getPost(posts(), focusedIndex());
    if (post) openWindow(post.url, true);
  });
  createShortcut("ctrl+c", () => {
    const post = getPost(posts(), focusedIndex());
    if (post) {
      navigator.clipboard
        .writeText(post.url)
        .then(() => {
          notifyInfo("Link copied.", { duration: 1000 });
        })
        .catch((e) => {
          glogger.error("copy-link: failure", e);
          notifyError("Failed to copy the link.");
        });
    }
  });
}

export function createCommentShortcuts(
  posts: Accessor<FeedPost[]>,
  focusedIndex: Accessor<number | null>,
) {
  createShortcut("k", () => {
    const post = getPost(posts(), focusedIndex());
    if (post?.commentsURL) openTab(post.commentsURL, true);
  });
  createShortcut("ctrl+k", () => {
    const post = getPost(posts(), focusedIndex());
    if (post?.commentsURL) openTab(post.commentsURL);
  });
  createShortcut("shift+k", () => {
    const post = getPost(posts(), focusedIndex());
    if (post?.commentsURL) openWindow(post.commentsURL);
  });
  createShortcut("ctrl+shift+k", () => {
    const post = getPost(posts(), focusedIndex());
    if (post?.commentsURL) openWindow(post.commentsURL, true);
  });
}

export function createPostBookmarkShortcut(
  posts: Accessor<FeedPost[]>,
  focusedIndex: Accessor<number | null>,
  toggleBookmarked: (
    feedId: number,
    guid: string,
    bookmarked: boolean,
  ) => Promise<void>,
) {
  createShortcut("b", () => {
    const post = getPost(posts(), focusedIndex());
    if (post) {
      toggleBookmarked(post.feedId, post.guid, !post.bookmarked);
    }
  });
}

export function createPostUnreadShortcut(
  posts: Accessor<FeedPost[]>,
  focusedIndex: Accessor<number | null>,
  toggleUnread: (
    feedId: number,
    guid: string,
    unread: boolean,
  ) => Promise<void>,
) {
  createShortcut("m", () => {
    const post = getPost(posts(), focusedIndex());
    if (post) {
      toggleUnread(post.feedId, post.guid, !post.unread);
    }
  });
}

function getPost(posts: FeedPost[], focusedIndex: number | null) {
  return focusedIndex !== null ? posts[focusedIndex] : null;
}

export function createShortcut(
  shortcut: Shortcut,
  onShortcutTriggered: (event: KeyboardEvent) => void,
) {
  onMount(() => {
    hotkeys(shortcut, (event) => {
      // avoid default browser actions from triggering (ctrl+f triggers find
      // in tab, escape closes extension, for example)
      event.preventDefault();
      // avoid accidentally triggering user-defined shortcuts for other chrome
      // extensions (chrome://extensions/shortcuts)
      event.stopPropagation();
      onShortcutTriggered(event);
    });
  });
  onCleanup(() => hotkeys.unbind(shortcut));
}

export type Shortcut =
  | "ctrl+l" // go to library page
  | "ctrl+b" // go to bookmarks page
  | "ctrl+p" // go to preferences page
  | "ctrl+alt+left" // go to previous page (the same as the browser back button)
  | "ctrl+alt+right" // go to next page (the same as the browser forward button)
  | "ctrl+t" // toggle the feed/folder page title dropdown
  | "ctrl+m" // mark all posts in feed/folder as read
  | "ctrl+u" // go to the unread posts page
  | "ctrl+a" // go to all posts page
  | "backspace" // go to the previous page (same as clicking the back button in the extension UI)
  | "up" // move up in the folder/feed or posts lists
  | "down" // move down in the folder/feed or posts lists
  | "right" // when a folder/feed is focused, go to that folder/feed page
  | "left" // when a folder/feed or a post is focused, go to the parent folder page
  | "m" // mark as read all posts of the focused feed/folder. mark the focused post as read or unread in a posts page
  | "u" // go to the unread posts page of the focused feed/folder
  | "a" // go to the all posts page of the focused feed/folder
  | "t" // toggle the three-dot menu of the focused feed/folder
  // given that the post is an anchor tag:
  // - enter already opens the link in a new tab or toggles the unread status of the post depending on the user preferences
  // - ctrl+enter already opens the link in a new tab
  // - shift+enter already opens the link in a new window
  // so below we're only adding a shortcut for ctrl+shift+enter
  | "ctrl+shift+enter" // open the focused post in a new incognito window and move to that window
  | "ctrl+c" // copy the link of the focused post
  | "k" // open the comments link (if any) of the focused post in a new tab and move to that tab
  | "ctrl+k" // open the comments link (if any) of the focused post in a new tab but keep the focus on the extension popup
  | "shift+k" // open the comments link (if any) of the focused post in a new window and move to that window
  | "ctrl+shift+k" // open the comments link (if any) of the focused post in a new incognito window and move to that window
  | "b" // to bookmark or remove the bookmark of the focused post
  | "l" // to load more posts in the node posts page
  | "ctrl+f" // go to filter posts page. Enabled in feed/folder/bookmarks pages
  | "ctrl+shift+f" // go to search posts page. Enabled in feed/folder/bookmarks pages
  | "escape"; // go from filter/search page to the previous page

/**
 * Copy of hotkeys.filter
 * https://github.com/jaywcjlove/hotkeys-js/blob/ea655c407644fa550b9cff2005f60ac4a6a081dc/src/index.ts#L87
 */
function enableShortcut(event: KeyboardEvent) {
  const target = (event.target || event.srcElement) as HTMLElement;
  const { tagName } = target;
  let flag = true;
  const isInput =
    tagName === "INPUT" &&
    ![
      "checkbox",
      "radio",
      "range",
      "button",
      "file",
      "reset",
      "submit",
      "color",
    ].includes((target as HTMLInputElement).type);
  // ignore: isContentEditable === 'true', <input> and <textarea> when readOnly
  // state is false, <select>
  if (
    target.isContentEditable ||
    ((isInput || tagName === "TEXTAREA" || tagName === "SELECT") &&
      !(target as HTMLInputElement | HTMLTextAreaElement).readOnly)
  ) {
    flag = false;
  }
  return flag;
}
