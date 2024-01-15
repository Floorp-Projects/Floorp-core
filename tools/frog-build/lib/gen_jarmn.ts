import * as fs from "fs/promises";
import { AUTO_GENERATED_COMMENT } from "./defines.js";

const moz_build = `
${AUTO_GENERATED_COMMENT}

JAR_MANIFESTS += ["jar.mn"]
{slot}
`;

const jar_mn = `
${AUTO_GENERATED_COMMENT}

{slot}
`;

export async function genJarManifest(dist: string, contentFileList: string[], moduleFileList: string[]) {
  const _moz_build = moz_build.replace(/{slot}/, `XPCOM_MANIFESTS += ["components.conf"]`);

  const _jar_mn = jar_mn.replace(
    /{slot}/,
    `
floorp.jar:
% content floorp %floorp/ contentaccessible=yes
  ${contentFileList.join("\n  ")}
% resource floorp %res/floorp/
  ${moduleFileList.join("\n  ")}
  `
  );
  fs.writeFile(`${dist}/moz.build`, _moz_build);
  fs.writeFile(`${dist}/jar.mn`, _jar_mn);
}
