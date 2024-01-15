import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

import { $ } from "execa";
import * as fs from "fs/promises";

export async function runViteBuild(): Promise<{ vite_filelist: string[] }> {
  process.chdir(`${__dirname}/../../..`);
  await $({ stderr: "inherit", stdout: "inherit" })`pnpm vite build`;
  const ret = {
    vite_filelist: JSON.parse((await fs.readFile("dist/.frog/vite.json")).toString()) as string[],
  };
  return ret;
}
