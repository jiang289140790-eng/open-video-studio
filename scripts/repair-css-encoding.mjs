import { readFile, writeFile } from "node:fs/promises";

const path = "apps/web/styles.css";
let css = await readFile(path, "utf8");
const repairs = new Map([
  ['content: "鉁?;', 'content: "✓";'],
  ['content: "宸插畬鎴?;', 'content: "已完成";'],
  ['content: "鍦ㄦ澶勬嫋鍔ㄥ浘鐗囷紝鎴?;', 'content: "在此处拖动图片，或";'],
  ['content: "鈥?;', 'content: "›";'],
]);
for (const [from, to] of repairs) css = css.replaceAll(from, to);
await writeFile(path, css, "utf8");
