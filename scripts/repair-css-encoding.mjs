import { readFile, writeFile } from "node:fs/promises";

const path = "apps/web/styles.css";
let css = await readFile(path, "utf8");
const replacements = [String.fromCodePoint(0x2713), "done", "upload image", ">"];
let index = 0;
css = css.replace(/^\s*content:\s*"[^"\r\n]*;\s*$/gm, () => `  content: "${replacements[index++] ?? ""}";`);
await writeFile(path, css, "utf8");
