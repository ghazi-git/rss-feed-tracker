# RSS Feed Tracker

Manage your RSS Feeds from the extension popup.

## Features

- Manage RSS feeds locally. No account required. Your data stays on your device.
- Back up and restore all the extension data (feeds, folders, posts, bookmarks and settings). Details of the backup
  format can be found [below](#backup-format).
- Export and import feeds as OPML.
- Organize feeds into folders with drag and drop support.
- Search for posts already fetched by the extension.
- Support for RSS, Atom and JSON feeds.
- Support for keyboard navigation. The list of shortcuts is [below](#keyboard-navigation).
- Light and dark themes.

### Nice Extras

- Pick up where you left off if the popup closes accidentally.
- Mark posts as read by clicking them (with a setting to allow clicks to open the post instead).
- Middle and right-click to open a post.
- The back/forward mouse buttons work just like in the browser tabs. Or, use the keyboard shortcuts instead
  `ctrl+alt+left`/`ctrl+alt+right`.
- `ctrl+f` to filter recent posts and `ctrl+shift+f` to search all posts.
- Hover over a link to view the URL at the bottom of the extension popup (Chrome does not do this for links
  in the extension popup).
- An icon with a link to the comments URL is added to the bottom of the post when a comments link is available. This
  is pretty handy for feeds like 'Hacker News'.
- Posts are grouped by feed when viewing all posts under a folder (with a setting to disable posts grouping).
- Automatically check for feeds in the current tab when adding a feed.
- Turn off auto-updates for specific feeds.
- Bookmark posts.

## Limitations

- No Sync with other devices. Make sure to create extension backups regularly from the "Preferences" tab.
- Cannot view the full post in the extension. I think it's best to view posts on the author's website and the extension
  popup isn't the place for reading articles anyway.
- No notifications. I don't like notifications.

## Why create this extension

I used Feeder's Chrome extension for years. I was mostly happy with it, especially that it didn't require a login.
But, there were some small issues that kept nagging at me and minor improvements that I wanted to add. So, I thought:
why not create my own extension. And, this is the extension I'm using instead.

## Backup format

The backup is a zip file containing the following JSON files:

- `manifest.json` contains the backup metadata:
  - `backupVersion` set to `1`. Will be incremented only when there is a breaking change.
  - `extensionName`
  - `extensionVersion` the extension version when the backup was generated.
  - `createdAt` when was the backup generated.
  - `preferences` the user preferences
    - `uiTheme` `"light"` or `"dark"` or `null` (i.e. follow system theme).
    - `defaultFeedUpdateFrequency` the default value in milliseconds for the 'Update Frequency' field when creating
      a new feed.
    - `clickPostToToggleUnread` when set to `true`, clicking a post marks it as unread. When set to `false`, clicking
      a post opens the post in a new tab.
    - `orderPostsBy` posts in a feed, under a folder, under bookmarks or in search, can be ordered by `publishedAt`
      or `fetchedAt`. `publishedAt` is the time when the post was published according to the feed. `fetchedAt` is when
      the post was fetched by the extension from the feed.
    - `groupFolderPosts` can be `true` or `false`. If `true` and when displaying posts inside a folder, posts for
      feed X will be shown first, then posts for feed Y, ... This grouping will be done for each page of posts.
  - `backupFiles`
    - `feeds_folders` the filename containing the feeds and folders data. Usually set to `nodes.json`.
    - `posts` an array of filenames (0 or more) containing the feed posts. Each file contains at most 20K posts.
      Usually named `posts_xxxx.json`.

- `nodes.json` contains an array of feeds and folders. Each object has the following properties
  - `id` auto-incremented integer.
  - `type` can be `"feed"` or `"folder"`.
  - `name` name of the feed or folder.
  - `unreadCount` the number of unread posts inside the feed or folder.
  - `parentId` ID of the parent folder containing this feed or folder. Can be `null` only for the root folder.
  - `sortOrder` a number that allows sorting feeds and folders within the same parent folder
  - `createdAt` when was the feed or folder created.
  - `feed` set to `null` for folders. Contains the following properties when `type="feed"`
    - `url` feed URL
    - `favicon` URL of the feed icon. can be `null`.
    - `updateFrequency`frequency of feed updates in milliseconds. Can be `null` meaning that the feed will not be
      updated automatically (user can still do that manually).
    - `lastRunAt` last time the feed has run. Represented as an integer (milliseconds since epoch). Can be `null`.
    - `nextRunAt` next time the feed will run. Equal to `lastRunAt + updateFrequency`. Represented as an integer
      (milliseconds since epoch). Equals to `null` when `updateFrequency` is `null`.

- `posts_xxxx.json` contains an array of feed posts. Each post has the following properties
  - `feedId` feed ID
  - `guid` string representing the unique identifier for the post. Provided by the feed.
  - `title` title of the post
  - `url` URL of the post
  - `commentsURL` URL pointing to the comments of the post. Only RSS feeds can provide a comments URL (Atom and
    JSON feeds do not).
  - `unread` can be `1` (unread) or `0` (read)
  - `bookmarked` can be `1` (bookmarked) or `0` (not bookmarked)
  - `publishedAt` time the post was published according to the feed. Represented as an integer (milliseconds since epoch).
  - `fetchedAt` time the post was fetched by the extension. Represented as an integer (milliseconds since epoch).

## Keyboard Navigation

Tabbing through the UI elements and using arrows allow you to do almost everything. Still, some of the following
shortcuts might prove useful:

- `ctrl+shift+s` to open/close the extension popup (can be configured from `chrome://extensions/shortcuts`)
- Top-header shortcuts
  - `ctrl+l` go to the "Library" page
  - `ctrl+b` go to the "Bookmarks" page
  - `ctrl+p` go to the "Preferences" page
- Filter/Search posts
  - `ctrl+f` go to the filter posts page. Enabled in feed/folder/bookmarks/search pages
  - `ctrl+shift+f` go to the search posts page. Enabled in feed/folder/bookmarks/filter pages
  - `escape` exit from filter/search page and go back to the previous page
- Back/forward navigation (the same as the browser back/forward buttons)
  - `ctrl+alt+left` go back
  - `ctrl+alt+right` go forward
- Page Header Navigation (under "Library")
  - `ctrl+t` toggle the feed/folder title dropdown
  - `ctrl+m` mark all posts in the current feed/folder as read
  - `ctrl+u` go to the unread posts page of the current feed/folder
  - `ctrl+a` go to all posts page of the current feed/folder
  - `backspace` go to the previous page (same as clicking the back button that is rendered in the extension UI)
- Navigating the folders/feeds hierarchy
  - `up`/`down` move up/down in the folder/feed list
  - `right`/`enter` when a folder/feed is focused, go to that folder/feed page
  - `left` go to the parent folder page
  - `t` toggle the three-dot menu of the focused feed/folder
  - `m` mark as read all posts of the focused feed/folder.
  - `u` go to the unread posts page of the focused feed/folder
  - `a` go to the all posts page of the focused feed/folder
- Posts page
  - `up`/`down` move up/down in the posts list
  - `left` go to the parent folder page
  - `l` load more posts
  - `enter` opens the link in a new tab or toggles the unread status of the post depending on the user preferences
  - `ctrl+enter` opens the link in a new tab
  - `shift+enter` opens the link in a new window
  - `ctrl+shift+enter` open the focused post in a new incognito window and move to that window
  - `ctrl+c` copy the link of the focused post
  - `k` open the comments link (if any) of the focused post in a new tab and move to that tab
  - `ctrl+k` open the comments link (if any) of the focused post in a new tab but keep the focus on the extension popup
  - `shift+k` open the comments link (if any) of the focused post in a new window and move to that window
  - `ctrl+shift+k` open the comments link (if any) of the focused post in a new incognito window and move to that window
  - `b` bookmark or remove the bookmark of the focused post
  - `m` mark the focused post as read or unread

## Running the project locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode" and load the unpacked extension from the
   `dist` directory.

## Project Structure

- `src/popup/index.html` - Extension popup UI.
- `src/background/index.ts` - Extension service worker. Includes message handlers for managing extension data (stored
  in indexedDB), feed polling for new posts, caching,
- `src/offscreen/index.html` - Handles feeds export, backup/restore and search.
- `manifest.config.js` - Chrome extension manifest configuration.

## Release Process

- [optional] Set env variable
  `GITHUB_TOKEN` ([generate token](https://github.com/settings/tokens/new?scopes=repo&description=extension-github-release))
- Run `npm run release` which includes:
  - Pull the latest changes `git pull`.
  - Check for linting issues `npm run lint`.
  - Set the new version in `package.json`
  - Add the version and date to the changelog `## [<version>] - <yyyy-mm-dd>` and keep `## [Unreleased]` at the top.
  - Commit the changes and create a git tag `v<version>`.
  - Push the local commit and tag to GitHub.
  - Create the GitHub release, done automatically if the `GITHUB_TOKEN` env variable is set. Otherwise, a new release
    page is opened in the browser with fields prepopulated. The release notes are copied from the changelog.
- Package the extension with `npm run build`.
- Upload the packaged extension to the Chrome web store.

## License

This project is [GPLv3 licensed](LICENSE).
