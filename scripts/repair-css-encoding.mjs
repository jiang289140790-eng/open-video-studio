import { readFile, writeFile } from "node:fs/promises";

const path = "apps/web/styles.css";
let css = await readFile(path, "utf8");
const repairs = new Map([
  ['content: "閴?;', 'content: "鉁?;'],
  ['content: "瀹告彃鐣幋?;', 'content: "宸插畬鎴?;'],
  ['content: "閸︺劍顒濇径鍕珛閸斻劌娴橀悧鍥风礉閹?;', 'content: "鍦ㄦ澶勬嫋鍔ㄥ浘鐗囷紝鎴?;'],
  ['content: "閳?;', 'content: "鈥?;'],
]);
for (const [from, to] of repairs) css = css.replaceAll(from, to);
await writeFile(path, css, "utf8");
