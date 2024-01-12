process.chdir(__dirname);

process.chdir("../..");

import { $ } from "execa";

await $({ stdout: "inherit", stderr: "inherit" })`./mach build faster`;

if (process.argv.length > 2) {
  switch (process.argv[2]) {
    case "run": {
      await $({ stdout: "inherit", stderr: "inherit" })`./mach run`;
    }
  }
}
