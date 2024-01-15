import { fileURLToPath } from "url";
import path from "path";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
process.chdir(__dirname);

import type { BuildSchema, JarSchema } from "./schema.js";

import * as fs from "fs/promises";
import { runViteBuild } from "./lib/vite.js";
import { compile } from "./lib/compile.js";

process.chdir("../..");
const root = JSON.parse((await fs.readFile("build.frog.jsonc")).toString()) as BuildSchema;

const pVite = runViteBuild();

root.build.subprojects.forEach(async (sub) => {
  const pathBuildFrog = sub;
  const dirBuildFrog = path.dirname(pathBuildFrog);
  console.log(`subDir: ${dirBuildFrog}`);
  const pSub = JSON.parse((await fs.readFile(pathBuildFrog)).toString()) as BuildSchema;

  pSub.build.jarmanifest.forEach(async (relativePathJarFrog) => {
    const pathJarFrog = path.resolve(dirBuildFrog, relativePathJarFrog);
    const dirJarFrog = path.dirname(pathJarFrog);
    console.log(`jarfrog: ${pathJarFrog}`);
    const jarfrog = JSON.parse((await fs.readFile(pathJarFrog)).toString()) as JarSchema;
    for (const jar of jarfrog.jars) {
      for (const [idx, val] of Object.entries(jar.content.normal)) {
        const pathContent = path.resolve(dirJarFrog, val.path);
        console.log(`pathContent: ${pathContent}`);
        console.log("Transcompiling: " + pathContent);

        const output = await compile(pathContent, jar.include_map);

        await fs.mkdir("./dist", { recursive: true });
        await fs.writeFile(`dist/${idx}`, output.code, { flag: "w" });
        if (output.map) {
          await fs.writeFile(`dist/${idx}.map`, output.map, { flag: "w" });
        }
      }
    }
  });
});

await pVite;

//fs.cp("../../browser/components/debug/components.conf", "../../dist/FloorpDebugHandlerComponents.conf");
//console.log("frog-build end");
