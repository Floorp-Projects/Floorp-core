import { defineConfig } from "vite";
import path from "path";

const r = (str: string): string => {
  return path.resolve(__dirname, str);
};

const outDir = r("./dist/browser");

export default defineConfig({
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: true,
    // outDir,
    assetsInlineLimit: 0,
    manifest: true,
    reportCompressedSize: false,

    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "browser/base/content/index.ts"),
      },
      output: {
        dynamicImportInCjs: true,
        format: "es",
        entryFileNames: "[name].js",
      },
      plugins: [],
    },
    minify: false,
  },
  plugins: [],
});
