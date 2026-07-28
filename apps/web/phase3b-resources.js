import { supabase, isSupabaseConfigured } from "./supabase-client.js";
import { getPhase3BResourceChecklist, isGenerationGatewayConfigured, runPhase3BDryRun, validatePhase3BLora, validatePhase3BWorkflow } from "./generation-gateway-client.js";

const $ = (selector) => document.querySelector(selector);
let toastTimer;
document.addEventListener("DOMContentLoaded", init);

async function init() {
  wire();
  if (!isSupabaseConfigured || !isGenerationGatewayConfigured || !supabase) return setOverall("配置未完成", "需要 staging Supabase 与 Generation Gateway");
  const { data } = await supabase.auth.getSession();
  const role = data.session?.user?.app_metadata?.role;
  if (!data.session?.user || !["admin", "operator"].includes(role)) {
    document.querySelectorAll("textarea, button").forEach((control) => { control.disabled = true; });
    return setOverall("无管理权限", "仅 admin/operator 可以访问资源校验");
  }
  await loadChecklist();
}
function wire() {
  $("[data-refresh]")?.addEventListener("click", loadChecklist);
  $("[data-validate-lora]")?.addEventListener("click", () => runJsonAction("[data-lora-result]", () => validatePhase3BLora({ manifest: parseJsonField("[data-lora-manifest]"), observation: parseJsonField("[data-lora-observation]") })));
  $("[data-validate-workflow]")?.addEventListener("click", () => runJsonAction("[data-workflow-result]", () => validatePhase3BWorkflow(parseJsonField("[data-workflow-import]"))));
  $("[data-run-dry-run]")?.addEventListener("click", () => runJsonAction("[data-dry-run-result]", () => runPhase3BDryRun(parseJsonField("[data-dry-run]"))));
}
async function loadChecklist() {
  try {
    setOverall("正在检查", "读取 Registry、Worker 与 Storage 门禁");
    const { checklist, allowlist } = await getPhase3BResourceChecklist();
    for (const key of ["base_model", "character_lora", "workflow_json", "node_mapping", "autodl_worker", "storage_upload"]) {
      const card = $(`[data-resource="${key}"]`);
      card.className = checklist[key];
      card.querySelector("strong").textContent = checklist[key];
    }
    const gate = $("[data-allowlist-gate]");
    gate.classList.toggle("ready", allowlist.eligible);
    gate.querySelector("strong").textContent = allowlist.eligible ? "真实 Provider allowlist：接入门禁已解除" : "真实 Provider allowlist：锁定";
    gate.querySelector("p").textContent = checklist.blocking_reasons.length
      ? `阻塞：${checklist.blocking_reasons.join("、")}`
      : allowlist.resources_ready_flag ? "资源与 Dry Run 验证均已确认。" : "全部资源已 ready；仍需通过真实资源 Dry Run 并设置资源就绪确认。";
    setOverall(checklist.status, checklist.provider_allowlist_eligible ? "资源已就绪，等待 Dry Run" : "真实资源尚未齐备");
  } catch (error) { setOverall("检查失败", error.message || "无法读取资源状态"); }
}
async function runJsonAction(selector, action) {
  const output = $(selector);
  try { output.textContent = "验证中…"; output.textContent = JSON.stringify(await action(), null, 2); }
  catch (error) {
    output.textContent = JSON.stringify({ valid: false, code: error.code || "VALIDATION_FAILED", message: error.message }, null, 2);
    toast(error.message || "校验失败");
  }
}
function parseJsonField(selector) {
  const text = $(selector).value.trim();
  if (!text) throw new Error("请先粘贴 JSON。");
  try { return JSON.parse(text); } catch { throw new Error("JSON 格式无效。"); }
}
function setOverall(title, detail) { $("[data-overall-state] strong").textContent = title; $("[data-overall-state] small").textContent = detail; }
function toast(message) {
  const item = $("[data-toast]"); item.textContent = message; item.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { item.hidden = true; }, 4200);
}
