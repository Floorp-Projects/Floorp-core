/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

import * as path from "node:path";
import { generateJarManifest } from "./scripts/gen_jarmn";

const r = (dir: string) => {
  return path.resolve(import.meta.dirname, dir);
};

export default defineConfig({
  publicDir: r("public"),
  build: {
    sourcemap: true,
    reportCompressedSize: false,
    minify: false,
    rollupOptions: {
      input: {
        csk: "./src/preferences/index.ts",
        content: "./src/content/index.ts",
      },
      output: {
        esModule: true,
        entryFileNames: "[name].js",
        assetFileNames: (chunk) => {
          return "assets/" + (chunk.name ?? "");
        },
        chunkFileNames: (chunk) => {
          return "assets/" + chunk.name + ".js";
        },
      },
    },
  },
  plugins: [
    solidPlugin({
      solid: {
        generate: "universal",
        moduleName: r("./src/solid-xul/solid-xul.ts"),
      },
    }),
    {
      name: "gen_jarmn",
      generateBundle(options, bundle, isWrite) {
        generateJarManifest(bundle);
      },
    },
  ],
  resolve: {
    alias: {
      "@private": r("../Floorp-private-components/nora"),
    },
  },
});
