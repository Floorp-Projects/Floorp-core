import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import { $ } from "execa";
import { genJarManifest } from "./gen-jarmanifest-dist.js";
import { kill } from "process";

console.time("debug");

const __dirname = fileURLToPath(new URL(".", import.meta.url));
process.chdir(__dirname);

process.chdir("..");

//await genJarManifest("dist");

const floorp_manifest = `
content floorp floorp_symlink/ contentaccessible=yes
`;

process.chdir(__dirname);
const dirs = await fs.opendir("../..");

const watcher_vite_manifest = fs.watch("../dist/.vite/manifest.json");

console.timeEnd("debug");

const pVite = $({
  stdout: "inherit",
  stderr: "inherit",
})`pnpm vite build --watch`;

for await (const dir of dirs) {
  //console.log(dir.name);
  if (dir.isDirectory()) {
    if (dir.name.includes("obj-")) {
      console.log(dir.name);
      const path = dir.path + "/" + dir.name;

      await fs.rm(`${path}/dist/bin/chrome/floorp_symlink`);
      await fs.symlink(
        `${__dirname}/../dist`,
        `${path}/dist/bin/chrome/floorp_symlink`,
        "junction"
      );
      await fs.writeFile(
        `${path}/dist/bin/chrome/floorp.manifest`,
        floorp_manifest
      );

      (async () => {
        let process_floorp;
        //const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        let timeout: NodeJS.Timeout | null = null;

        let doNotExit = false;

        const killAndRun = async () => {
          if (process_floorp) {
            doNotExit = true;
            process_floorp.kill();
          }
          const _process_floorp = $({
            stdout: "inherit",
            stderr: "inherit",
            stdin: "inherit",
          })`${path}/dist/bin/floorp.exe -no-remote -wait-for-browser -attach-console -profile ${path}/tmp/profile-default`;
          _process_floorp.on("exit", () => {
            if (doNotExit) {
              doNotExit = false;
            } else {
              pVite.kill();
              process.kill(0);
            }
          });
          process_floorp = _process_floorp;
        };

        for await (const _ of watcher_vite_manifest) {
          clearTimeout(timeout);
          timeout = setTimeout(killAndRun, 1000);
        }
      })();

      // process_floorp.kill();

      //in Windows, -no-remote -wait-for-browser -profile C:\Users\user\Desktop\nyanrus_Floorp\obj-x86_64-pc-windows-msvc\tmp\profile-default -attach-console
      //https://searchfox.org/mozilla-central/rev/961a9e56a0b5fa96ceef22c61c5e75fb6ba53395/python/mozbuild/mozbuild/mach_commands.py#1900

      break;
    }
  }
}

// process.chdir("../..");
// $({
//   stdout: "inherit",
//   stderr: "inherit",
// })`./mach run`;
