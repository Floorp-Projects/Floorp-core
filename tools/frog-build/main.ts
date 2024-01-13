import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
process.chdir(__dirname);

import swc from "@swc/core";
import * as fs from "fs/promises";

console.log("Transcompiling: FloorpDebugHandler.sys.mts");
const output = await swc.transformFile(
  "../../browser/components/debug/FloorpDebugHandler.sys.mts",
  {
    jsc: {
      parser: {
        syntax: "typescript",
      },
      target: "esnext",
    },
    sourceMaps: true,
  }
);

fs.writeFile("../../dist/FloorpDebugHandler.sys.mjs", output.code);
fs.writeFile("../../dist/FloorpDebugHandler.sys.mjs.map", output.map);

fs.cp(
  "../../browser/components/debug/components.conf",
  "../../dist/FloorpDebugHandlerComponents.conf"
);
console.log("frog-build end");
