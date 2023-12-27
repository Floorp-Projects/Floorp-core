import * as fs from "fs/promises";
import { processAll4Test } from "xpidl2dts";

const main = async () => {
  await processAll4Test(
    "../..",
    [
      "xpcom",
      "netwerk",
      "dom/interfaces/security",
      "dom/base",
      "dom/interfaces/base",
      "uriloader",
      "services",
      "widget",
      "image",
      "layout",
      "js",
      "toolkit",
      "caps",
    ],
    "./xpidl2dts@0.1.0/dist"
  );

  await fs.rm("../@types/firefox", { recursive: true });
  await fs.cp("./xpidl2dts@0.1.0/dist/p", "../@types/firefox", {
    recursive: true,
  });
  fs.rm("./xpidl2dts@0.1.0/dist", { recursive: true });
};

main();
