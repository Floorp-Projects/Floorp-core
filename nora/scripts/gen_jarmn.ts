import * as fs from "node:fs/promises";

export async function generateJarManifest(bundle: object) {
  console.log("generate jar.mn");
  const viteManifest = bundle;

  const arr = [];
  for (const i of Object.values(viteManifest)) {
    arr.push((i as { fileName: string })["fileName"]);
  }

  await fs.writeFile(
    "dist/jar.mn",
    `floorp.jar:\n% content nora %nora/ contentaccessible=yes\n ${Array.from(
      new Set(arr),
    )
      .map((v) => `nora/${v} (${v})`)
      .join("\n ")}`,
  );
  console.log("generate end jar.mn");
}
