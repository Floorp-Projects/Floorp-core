import * as fs from "fs/promises";
import type { Manifest } from "vite";

const moz_build = `
# ---------------- Floorp AUTO_GENERATED_FILE -----------------------
# ---------------- ******* DO NOT EDIT ****** -----------------------
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

JAR_MANIFESTS += ["jar.mn"]
XPCOM_MANIFESTS += ["FloorpDebugHandlerComponents.conf"]
EXTRA_JS_MODULES += ["FloorpDebugHandler.sys.mjs"]
`;

const jar_mn = `
# ---------------- Floorp AUTO_GENERATED_FILE -----------------------
# ---------------- ******* DO NOT EDIT ****** -----------------------
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

floorp.jar:
% content floorp %floorp/ contentaccessible=yes
{slot}
`;

export const genJarManifest = async (root: string) => {
  const file = await fs.readFile(root + "/.vite/manifest.json");
  const json = JSON.parse(file.toString()) as Manifest;
  const fileEntries = [];
  for (const [_, entry] of Object.entries(json)) {
    fileEntries.push(entry.file, entry.file + ".map");
  }

  let jar_mn_str = "";
  for (const i of fileEntries) {
    jar_mn_str += `  floorp/${i} (${i})\n`;
  }
  fs.writeFile(root + "/moz.build", moz_build);
  fs.writeFile(root + "/jar.mn", jar_mn.replace(/{slot}/, jar_mn_str));
  console.log("build script generated");
};
import { fileURLToPath, pathToFileURL } from "url";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  process.chdir(__dirname);
  genJarManifest("../dist");
}
