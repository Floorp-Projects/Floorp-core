import { AUTO_GENERATED_COMMENT } from "./defines.js";
import { JarSchema } from "./schema.js";

export function generateJarMNFromJarFrog(manifest: JarSchema) {
  let ret = AUTO_GENERATED_COMMENT;
  for (const jar of manifest.jars) {
    ret += jar.jarname + ":";
    //* CHROME CONTENT
    if (jar.chrome.content) {
      let content_str = "% content ";
      for (const item_content of jar.chrome.content) {
        if (typeof item_content === "string") {
          content_str += item_content;
        } else if (Array.isArray(item_content)) {
          content_str += item_content.join(" ");
        }
      }
      ret += content_str;
    }

    for (const [idx, val] of Object.entries(jar.content.normal)) {
      ret += `  ${jar.pathPrefix}${idx} (${val.path})`;
      if (jar.include_map && (val.path.endsWith("ts") || val.path.endsWith("js"))) {
        ret += `  ${jar.pathPrefix}${idx}.map (${val.path}.map)`;
      }
    }
    for (const [idx, val] of Object.entries(jar.content.preprocess)) {
      ret += `* ${jar.pathPrefix}${idx} (${val.path})`;
    }
  }
}
