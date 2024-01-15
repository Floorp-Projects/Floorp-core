import swc from "@swc/core";

export async function compile(path: string, sourcemap: boolean): Promise<{ code: string; map?: string }> {
  return swc.transformFile(path, {
    jsc: {
      parser: {
        syntax: "typescript",
      },
      target: "esnext",
    },
    sourceMaps: sourcemap,
  });
}
