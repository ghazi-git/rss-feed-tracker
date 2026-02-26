# RSS Feed Tracker

Chrome extension to manage RSS feeds.

## Features

- Fully client-side RSS Reader. No account required. No tracking. Your data stays on your device.
- Back up and restore all the extension data (feeds, folders, posts and settings).
- Export and import feeds as OPML.
- Organize feeds into folders with drag and drop support.
- Search for posts already fetched by the extension.
- Supports RSS, Atom and JSON feeds.
- Light and dark themes.

### Nice Extras

- Pick up where you left off if the popup closes accidentally.
- Mark posts as read by clicking them (with a setting to allow clicks to open the post instead).
- Middle and right-click to open a post.
- The back/forward mouse buttons work just like in the browser tabs.
- Hover over a link to view the URL at the bottom of the extension popup (Chrome does not do this for links
  in the extension popup).
- An icon with a link to the comments URL is added to the bottom of the post when a comments link is available. This
  is pretty handy for feeds like 'Hacker News'.
- Automatically check for feeds in the current tab when adding a feed.
- Turn off auto-updates for specific feeds.
- Bookmark posts.

## Limitations

- Cannot view the full post in the extension. I think it's best to view posts on the author's website. Extracting
  the posts text from the original page and displaying it in the extension directly feels wrong on so many levels
  and iframes don't always work.
- No notifications. I don't like notifications.
- No Sync with other devices.

## Why create this extension

I used Feeder's Chrome extension for years. I was mostly happy with it, especially that it didn't require a login.
But, there were some small issues that kept nagging at me and minor improvements that I wanted to add. So, I thought:
why not create my own extension. And, this is the extension I'm using instead.

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
  `GITHUB_TOKEN` ([generate token](https://github.com/settings/tokens/new?scopes=repo&description=indexeddb-browser-github-release))
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
