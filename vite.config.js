import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url';

import { crx } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import zip from 'vite-plugin-zip-pack'

import manifest from './manifest.config.js'
import { name, version } from './package.json'

const currentFilename = fileURLToPath(import.meta.url);
const currentFolder = dirname(currentFilename);

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(currentFolder, 'src')}`,
    },
  },
  plugins: [
    solid(),
    crx({ manifest }),
    zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
  ],
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
})
