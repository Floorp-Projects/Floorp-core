import { defineConfig } from "vite";
import path from "path";

const r = (str: string): string => {
  return path.resolve(__dirname, str);
};

const outDir = r("./dist");

export default defineConfig({
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: true,
    // outDir,
    assetsInlineLimit: 0,
    manifest: true,
    reportCompressedSize: false,
    modulePreload: {
      polyfill: false,
    },

    rollupOptions: {
      // input: {
      //   index: path.resolve(__dirname, "browser/base/content/index.ts"),
      // },
      // output: {
      //   dynamicImportInCjs: true,
      //   format: "es",
      //   entryFileNames: "[name].js",
      // },
      // plugins: [],
      external(source, importer, isResolved) {
        // return !source.includes("index.ts");
        return source.startsWith("chrome://");
      },
    },
    minify: false,
    lib: {
      entry: [r("browser/base/content/index.ts")],
      formats: ["es"],
    },
  },
  plugins: [
    // {
    //   name: "hook",
    //   enforce: "post",
    //   configureServer(server) {
    //     server.
    //   },
    //   handleHotUpdate(ctx) {
    //     ctx.server.close();
    //     console.log(ctx.modules);
    //     return [];
    //   },
    //   writeBundle(option, bundle) {
    //     console.log(bundle);
    //   },
    // },
  ],
});
