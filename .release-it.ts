import type { Config } from "release-it";

export default {
  hooks: {
    "before:init": ["git pull", "npm run lint"],
  },
  // https://github.com/release-it/release-it/blob/main/docs/git.md
  git: {
    commit: true,
    commitMessage: "Release v${version}",
    tag: true,
    tagName: "v${version}",
    push: true,
  },
  // https://github.com/release-it/release-it/blob/main/docs/github-releases.md
  github: {
    release: true,
    releaseName: "Release v${version}",
  },
  plugins: {
    "@release-it/keep-a-changelog": {
      // changes the version in the changelog file.
      // Also, the addition of this plugin allows extraction of the version
      // changes from the changelog files and their use in GitHub release notes
      filename: "CHANGELOG.md",
      addUnreleased: true,
    },
  },
  npm: {
    publish: false,
  },
} satisfies Config;
