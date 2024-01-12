import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import { $ } from "execa";
import { genJarManifest } from "./gen-jarmanifest-dist.js";
import fg from "fast-glob";
import chokidar from "chokidar";

if (process.platform !== "win32") {
  console.warn("\x1b[31mThis Debug Script only supports Windows.");
  console.warn("\x1b[31mPlease run `pnpm debug:mach` to debug in other OS.");
  console.warn("\x1b[31m※ Caution :");
  console.warn("\x1b[31m`pnpm debug:mach` does not have watching mechanism.");
  console.warn(
    "\x1b[31mYou should close Floorp and run the script on every change."
  );
  process.exit(-1);
}

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

let path = "";
for await (const dir of dirs) {
  //console.log(dir.name);
  if (dir.isDirectory()) {
    if (dir.name.includes("obj-")) {
      console.log(dir.name);
      path = dir.path + "/" + dir.name;

      // process_floorp.kill();

      break;
    }
  }
}

//* browser/base/content
{
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
}
//* browser/components

async function writeModule() {
  const entriesModule = await fg([
    `../browser/components/*.sys.mjs`,
    `../browser/components/*.jsm`,
  ]);
  for (const entry of entriesModule) {
    // console.log(
    //   `${path}/dist/bin/browser/modules/${entry
    //     .replaceAll(/\\/g, "/")
    //     .split("/")
    //     .at(-1)}`
    // );
    // console.log((await fs.readFile(`${__dirname}/${entry}`)).toString());
    // try {
    //   await fs.access(
    //     `${path}/dist/bin/browser/modules/${entry
    //       .replaceAll(/\\/g, "/")
    //       .split("/")
    //       .at(-1)}`
    //   );
    //   await fs.rm(
    //     `${path}/dist/bin/browser/modules/${entry
    //       .replaceAll(/\\/g, "/")
    //       .split("/")
    //       .at(-1)}`
    //   );
    // } catch {}

    // await fs.symlink(
    //   `${__dirname}/${entry}`,
    //   `${path}/dist/bin/browser/modules/${entry
    //     .replaceAll(/\\/g, "/")
    //     .split("/")
    //     .at(-1)}`,
    //   "junction"
    // );

    await fs.writeFile(
      `${path}/dist/bin/browser/modules/${entry
        .replaceAll(/\\/g, "/")
        .split("/")
        .at(-1)}`,
      (await fs.readFile(`${__dirname}/${entry}`)).toString(),
      { encoding: "utf8", flag: "w" }
    );
  }
}
await writeModule();
// process.kill(0);
(async () => {
  let process_floorp = null;
  //const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  let timeout: NodeJS.Timeout | null = null;
  let doNotExit = false;

  const watcherModule = chokidar.watch([
    `../browser/components/*.sys.mjs`,
    `../browser/components/*.jsm`,
  ]);

  const killAndRun = async () => {
    if (process_floorp) {
      doNotExit = true;
      process_floorp.kill();
    }

    //https://searchfox.org/mozilla-central/rev/961a9e56a0b5fa96ceef22c61c5e75fb6ba53395/python/mozbuild/mozbuild/mach_commands.py#1900
    //in Windows, -no-remote -wait-for-browser -profile C:\Users\user\Desktop\nyanrus_Floorp\obj-x86_64-pc-windows-msvc\tmp\profile-default -attach-console
    const _process_floorp = $({
      stdout: "inherit",
      stderr: "inherit",
    })`${path}/dist/bin/floorp.exe -no-remote -wait-for-browser -attach-console -profile ${path}/tmp/profile-default`;

    _process_floorp.on("exit", () => {
      if (doNotExit) {
        doNotExit = false;
      } else {
        pVite.kill();
        watcherModule.close();
        process.kill(0);
      }
    });
    process_floorp = _process_floorp;
  };
  //timeout = setTimeout(killAndRun, 1000);

  watcherModule.on("all", async (evName, stats) => {
    await writeModule();
    clearTimeout(timeout);
    timeout = setTimeout(killAndRun, 3000);
  });

  (async () => {
    for await (const _ of watcher_vite_manifest) {
      clearTimeout(timeout);
      timeout = setTimeout(killAndRun, 3000);
    }
  })();
})();

const pVite = $({
  stdout: "inherit",
  stderr: "inherit",
})`pnpm vite build --watch`;

// process.chdir("../..");
// $({
//   stdout: "inherit",
//   stderr: "inherit",
// })`./mach run`;
