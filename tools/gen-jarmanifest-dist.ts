import * as fs from "fs/promises";
import path from "path";
import { Manifest } from "vite";

const moz_build = `
# ---------------- Floorp AUTO_GENERATED_FILE -----------------------
# ---------------- ******* DO NOT EDIT ****** -----------------------
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

JAR_MANIFESTS += ["jar.mn"]
`;

const jar_mn = `
# ---------------- Floorp AUTO_GENERATED_FILE -----------------------
# ---------------- ******* DO NOT EDIT ****** -----------------------
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

browser.jar:
% content floorp %floorp/ contentaccessible=yes
{slot}
`;

const outDir = "browser";

export const genJarManifest = async (root: string) => {
  const file = await fs.readFile(root + "/dist/.vite/manifest.json");
  const json = JSON.parse(file.toString()) as Manifest;
  let fileEntries = [];
  for (const [_, entry] of Object.entries(json)) {
    fileEntries.push(entry.file, entry.file + ".map");
  }

  let jar_mn_str = "";
  for (const i of fileEntries) {
    jar_mn_str += `floorp/${outDir}/${i} (${i})\n`;
  }
  fs.writeFile(root + "/dist/moz.build", moz_build);
  fs.writeFile(root + "/dist/jar.mn", jar_mn.replace(/{slot}/, jar_mn_str));
  console.log("build script generated");
};

genJarManifest("..");
