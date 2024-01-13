import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import { $ } from "execa";
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
    `../browser/components/**/*.sys.mjs`,
    `../browser/components/**/*.jsm`,
  ]);
  for (const entry of entriesModule) {
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

const watcherModule = chokidar.watch([
  `../browser/base/content/**/*.*`,
  `../browser/components/*.sys.mjs`,
  `../browser/components/*.jsm`,
]);
(async () => {
  let process_floorp = null;
  //const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  let timeout: NodeJS.Timeout | null = null;
  let doNotExit = false;

  const killAndRun = async () => {
    if (process_floorp) {
      console.log("kill floorp");
      doNotExit = true;
      process_floorp.kill(2);
    }

    //https://searchfox.org/mozilla-central/rev/961a9e56a0b5fa96ceef22c61c5e75fb6ba53395/python/mozbuild/mozbuild/mach_commands.py#1900
    //in Windows, -no-remote -wait-for-browser -profile C:\Users\user\Desktop\nyanrus_Floorp\obj-x86_64-pc-windows-msvc\tmp\profile-default -attach-console
    const _process_floorp = $({
      stdout: "inherit",
      stderr: "inherit",
    })`${path}/dist/bin/floorp.exe -no-remote -wait-for-browser -attach-console -profile ${path}/tmp/profile-default`;

    //_process_floorp.kill(0);

    _process_floorp.on("exit", () => {
      if (doNotExit) {
        doNotExit = false;
      } else {
        process.exit(0);
      }
    });
    process_floorp = _process_floorp;
  };
  //timeout = setTimeout(killAndRun, 1000);
  let running = false;

  watcherModule.on("all", async (evName, stats) => {
    if (running) {
      return;
    }
    running = true;
    await $({
      stdout: "inherit",
      stderr: "inherit",
    })`pnpm vite build`;
    await writeModule();
    clearTimeout(timeout);
    timeout = setTimeout(killAndRun, 500);
    running = false;
  });
})();

//https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    console.log("Run cleanup on exit");
    watcherModule.close();

    console.log("End");
  }

  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

// do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// process.chdir("../..");
// $({
//   stdout: "inherit",
//   stderr: "inherit",
// })`./mach run`;
