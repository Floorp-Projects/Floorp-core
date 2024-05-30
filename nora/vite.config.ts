/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { $ } from "execa";

import * as path from "node:path";
import { generateJarManifest } from "./scripts/gen_jarmn";
import puppeteer from "puppeteer-core";
import { Browser } from "puppeteer-core";

const r = (dir: string) => {
  return path.resolve(import.meta.dirname, dir);
};

function binPath(platform: "windows-x64"): string {
  switch (platform) {
    case "windows-x64": {
      return "obj-x86_64-pc-windows-msvc/dist/bin/floorp.exe";
    }
  }
}

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
      enforce: "post",
      async generateBundle(options, bundle, isWrite) {
        this.emitFile({
          type: "asset",
          fileName: "jar.mn",
          needsCodeReference: false,
          source: await generateJarManifest(bundle),
        });
      },
    },
    (() => {
      let browser: Browser;
      let intended_close = false;
      return {
        name: "run_browser",
        enforce: "post",
        buildEnd(error) {
          (async () => {
            if (this.meta.watchMode) {
              if (browser) {
                console.log("Browser Restarting...");
                intended_close = true;
                await browser.close();
                intended_close = false;
              }
              const _cwd = process.cwd();
              process.chdir("../..");
              await $({ stdio: "inherit" })`./mach build faster`;
              process.chdir(_cwd);

              browser = await puppeteer.launch({
                headless: false,
                protocol: "webDriverBiDi",
                dumpio: true,
                product: "firefox",
                executablePath: path.join("../..", binPath("windows-x64")),
                userDataDir: "./dist/profile/test",
                extraPrefsFirefox: { "browser.newtabpage.enabled": true },
              });
              (await browser.pages())[0].goto("about:newtab");
              browser.on("disconnected", () => {
                if (!intended_close) process.exit(1);
              });
            }
          })();
        },
      };
    })(),
  ],
  resolve: {
    alias: {
      "@private": r("../Floorp-private-components/nora"),
    },
  },
});
