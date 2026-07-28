import { supabase, isSupabaseConfigured } from "./supabase-client.js";
import {
  analyzeGatewayReference,
  confirmGatewayReferenceAnalysis,
  createGatewayGeneration,
  ensureGatewayMockCharacter,
  getGatewayGeneration,
  isGenerationGatewayConfigured,
  listGatewayCharacters,
  listGatewayLoras,
  listGatewayLoraVersions,
  listGatewayWorkflows,
  listGatewayWorkflowVersions,
  patchGatewayLora,
  patchGatewayWorkflow,
  waitForGatewayGeneration,
} from "./generation-gateway-client.js";

const WORKFLOW_ID = "mock-character-reference-remake-v1";
const STORAGE_BUCKET = "generation-inputs";
const TERMINAL = new Set(["completed", "failed", "cancelled"]);
const timeline = ["queued", "submitted", "running", "post_processing", "reviewing", "completed"];
const state = { user: null, asset: null, analysisId: "", analysis: null, confirmedAnalysis: null, characters: [], selectedCharacterId: "", job: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  wireInteractions();
  renderPlanSummary();
  if (!isSupabaseConfigured || !isGenerationGatewayConfigured || !supabase) {
    setSessionStatus("配置未完成", "需要 staging Supabase 与 Gateway", false);
    disableWorkspace(true);
    return;
  }
  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user ?? null;
  if (!state.user) {
    setSessionStatus("需要登录", "请先登录 staging 账号", false);
    disableWorkspace(true);
    $(".hero-status small").innerHTML = '<a href="./signin.html">前往登录</a>';
    return;
  }
  setSessionStatus("已连接 staging", state.user.email || state.user.id, true);
  await loadCharacters();
  await restoreJob();
  const role = state.user.app_metadata?.role;
  if (role === "admin" || role === "operator") await loadRegistries();
  else {
    $("[data-registry-access]").textContent = "仅管理员可用";
    $("[data-workflow-registry]").innerHTML = '<div class="empty-state"><strong>权限隔离已生效</strong><p>登录角色不是 admin/operator，Registry 管理接口不会返回数据。</p></div>';
  }
}

function wireInteractions() {
  const fileInput = $("[data-reference-file]");
  const dropzone = $("[data-reference-dropzone]");
  fileInput?.addEventListener("change", () => handleFile(fileInput.files?.[0]));
  dropzone?.addEventListener("dragover", (event) => { event.preventDefault(); dropzone.classList.add("dragging"); });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("dragging"));
  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
    handleFile(event.dataTransfer?.files?.[0]);
  });
  $("[data-analysis-form]")?.addEventListener("submit", confirmAnalysis);
  $("[data-plan-form]")?.addEventListener("submit", submitPlan);
  $("[data-plan-form]")?.addEventListener("input", renderPlanSummary);
  $("[data-refresh-job]")?.addEventListener("click", refreshJob);
  $$("[data-registry-tab]").forEach((button) => button.addEventListener("click", () => switchRegistryTab(button.dataset.registryTab)));
}

async function handleFile(file) {
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) {
    return toast("请选择 10 MB 以内的 JPG、PNG 或 WebP 图片。");
  }
  setChip("[data-upload-state]", "上传中");
  try {
    const dimensions = await imageDimensions(file);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "reference.png";
    const storageKey = `${state.user.id}/phase3a/${crypto.randomUUID()}-${safeName}`;
    const uploaded = await supabase.storage.from(STORAGE_BUCKET).upload(storageKey, file, { contentType: file.type, upsert: false });
    if (uploaded.error) throw uploaded.error;
    const assetId = `phase3a_ref_${crypto.randomUUID()}`;
    const inserted = await supabase.from("media_assets").insert({
      id: assetId,
      owner_user_id: state.user.id,
      asset_type: "image",
      source_type: "phase3a_reference_upload",
      storage_key: storageKey,
      display_name: file.name,
      tags_json: ["phase3a", "reference", "mock"],
      metadata_json: {
        storage_bucket: STORAGE_BUCKET,
        mime_type: file.type,
        size_bytes: file.size,
        width: dimensions.width,
        height: dimensions.height,
        mock_pipeline: true,
      },
      processing_status: "ready",
      rights_status: "user_uploaded",
      moderation_status: "pending",
      visibility_status: "private",
    }).select("id").single();
    if (inserted.error) {
      await supabase.storage.from(STORAGE_BUCKET).remove([storageKey]);
      throw inserted.error;
    }
    state.asset = { id: assetId, storageKey, mimeType: file.type, sizeBytes: file.size, width: dimensions.width, height: dimensions.height, name: file.name };
    $("[data-reference-image]").src = URL.createObjectURL(file);
    $("[data-reference-name]").textContent = file.name;
    $("[data-reference-meta]").textContent = `${dimensions.width} × ${dimensions.height} · ${formatBytes(file.size)}`;
    $("[data-reference-preview]").hidden = false;
    setChip("[data-upload-state]", "已私有上传");
    markStep("upload");
    await runMockAnalyzer();
  } catch (error) {
    setChip("[data-upload-state]", "上传失败");
    toast(error.message || "参考图上传失败。");
  }
}

async function runMockAnalyzer() {
  setChip("[data-analysis-state]", "Mock 分析中");
  const portrait = state.asset.height >= state.asset.width;
  try {
    const response = await analyzeGatewayReference({
      reference_asset_id: state.asset.id,
      analyzer_mode: "mock",
      observations: {
        people_count: 1,
        shot_type: portrait ? "portrait" : "medium_shot",
        pose: "standing",
        camera_angle: "eye_level",
        composition: "centered",
        scene: "reference scene",
        lighting: "soft",
        expression: "neutral",
        outfit: "reference outfit",
        visible_body_region: portrait ? "upper_or_full_body" : "upper_body",
      },
    });
    state.analysisId = response.analysis_id;
    state.analysis = response.analysis;
    populateAnalysisForm(response.analysis);
    $("[data-analysis-empty]").hidden = true;
    $("[data-analysis-form]").hidden = false;
    setChip("[data-analysis-state]", "待用户确认");
    markStep("analysis", false);
  } catch (error) {
    setChip("[data-analysis-state]", "分析失败");
    toast(error.message || "Mock Analyzer 请求失败。");
  }
}

function populateAnalysisForm(analysis) {
  const form = $("[data-analysis-form]");
  Object.entries(analysis).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field && typeof value !== "object") field.value = String(value);
  });
  $("[data-analysis-confidence]").value = analysis.confidence;
  $("[data-analysis-confidence-label]").textContent = `${Math.round(analysis.confidence * 100)}%`;
}

async function confirmAnalysis(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const analysis = {
    ...state.analysis,
    people_count: Number(form.people_count.value),
    shot_type: form.shot_type.value.trim(),
    pose: form.pose.value.trim(),
    camera_angle: form.camera_angle.value.trim(),
    composition: form.composition.value.trim(),
    scene: form.scene.value.trim(),
    lighting: form.lighting.value.trim(),
    expression: form.expression.value.trim(),
    outfit: form.outfit.value.trim(),
    visible_body_region: form.visible_body_region.value.trim(),
  };
  try {
    const response = await confirmGatewayReferenceAnalysis(state.analysisId, { reference_asset_id: state.asset.id, analysis });
    state.confirmedAnalysis = response.analysis;
    setChip("[data-analysis-state]", "已确认");
    markStep("analysis");
    updatePlanReady();
    renderPlanSummary();
    toast("分析结果已确认并保存。");
  } catch (error) {
    toast(error.message || "确认分析失败。");
  }
}

async function loadCharacters() {
  try {
    let response = await listGatewayCharacters();
    if (!response.characters?.length) {
      await ensureGatewayMockCharacter();
      response = await listGatewayCharacters();
    }
    state.characters = response.characters || [];
    state.selectedCharacterId = state.characters[0]?.id || "";
    renderCharacters();
    if (state.selectedCharacterId) markStep("character");
  } catch (error) {
    $("[data-character-list]").innerHTML = `<div class="empty-state"><strong>角色加载失败</strong><p>${escapeHtml(error.message || "未知错误")}</p></div>`;
  }
}

function renderCharacters() {
  $("[data-character-count]").textContent = `${state.characters.length} 个角色`;
  $("[data-character-list]").innerHTML = state.characters.map((character) => `
    <button class="character-card ${character.id === state.selectedCharacterId ? "selected" : ""}" type="button" data-character-id="${escapeHtml(character.id)}">
      <span class="character-avatar">${escapeHtml(character.display_name.slice(0, 1))}</span>
      <span><strong>${escapeHtml(character.display_name)}</strong><small>${statusLabel(character.status)} · ${escapeHtml(character.lora?.version || "-")}</small></span>
      <span>›</span>
    </button>
  `).join("") || '<div class="empty-state"><strong>暂无可用角色</strong></div>';
  $$("[data-character-id]").forEach((button) => button.addEventListener("click", () => {
    state.selectedCharacterId = button.dataset.characterId;
    renderCharacters();
    markStep("character");
    updatePlanReady();
    renderPlanSummary();
  }));
  renderCharacterDetail();
}

function renderCharacterDetail() {
  const character = selectedCharacter();
  if (!character) return;
  $("[data-character-detail]").innerHTML = `
    <div class="character-title">
      <div><h3>${escapeHtml(character.display_name)}</h3><p>${escapeHtml(character.description || "暂无描述")}</p></div>
      <span class="status-chip">${statusLabel(character.status)}</span>
    </div>
    <div class="character-meta">
      <span>声明年龄 ${Number(character.declared_age)}+</span><span>LoRA ${escapeHtml(character.lora?.version || "-")}</span>
      <span>权重 ${Number(character.lora?.min_weight)}–${Number(character.lora?.max_weight)}</span><span>Mock-only</span>
    </div>
    <div class="preview-strip">${(character.preview_assets || []).map((asset) => `<img src="${escapeHtml(asset.url)}" alt="Mock 角色预览资产">`).join("")}</div>
  `;
}

function renderPlanSummary() {
  const character = selectedCharacter();
  const form = $("[data-plan-form]");
  const values = form ? new FormData(form) : new FormData();
  const rows = [
    ["工作流", WORKFLOW_ID],
    ["参考资产", state.asset?.id || "尚未选择"],
    ["分析确认", state.confirmedAnalysis ? state.analysisId : "尚未确认"],
    ["角色", character?.display_name || "尚未选择"],
    ["保留项", "姿态、构图"],
    ["场景替换", String(values.get("replace_scene") || "不替换")],
    ["画面与数量", `${values.get("aspect_ratio") || "3:4"} · ${values.get("output_count") || 1} 张`],
    ["执行方式", "MockProvider（无 GPU）"],
  ];
  $("[data-plan-summary]").innerHTML = rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function updatePlanReady() {
  const ready = Boolean(state.asset && state.confirmedAnalysis && selectedCharacter());
  $("[data-plan-submit]").disabled = !ready;
  setChip("[data-plan-state]", ready ? "计划已就绪" : "等待确认");
  if (ready) markStep("plan", false);
}

async function submitPlan(event) {
  event.preventDefault();
  if (!state.asset || !state.confirmedAnalysis || !selectedCharacter()) return;
  const data = new FormData(event.currentTarget);
  const input = {
    media_type: "image",
    creation_mode: "image_to_image",
    prompt: String(data.get("prompt")),
    structured_options: {
      execution_mode: "mock_reference",
      workflow_id: WORKFLOW_ID,
      people_count: 1,
      preserve_pose: true,
      preserve_composition: true,
      reference_analysis_id: state.analysisId,
      reference_analysis_confirmed: true,
      reference_analysis: state.confirmedAnalysis,
      replace_scene: nullable(data.get("replace_scene")),
      outfit_override: nullable(data.get("outfit_override")),
      expression_override: nullable(data.get("expression_override")),
      lora_weight: Number(data.get("lora_weight")),
    },
    reference_assets: [{
      asset_id: state.asset.id,
      mime_type: state.asset.mimeType,
      size_bytes: state.asset.sizeBytes,
      width: state.asset.width,
      height: state.asset.height,
    }],
    character_id: selectedCharacter().id,
    aspect_ratio: String(data.get("aspect_ratio")),
    output_count: Number(data.get("output_count")),
    subject_age_confirmed_adult: Boolean(data.get("adult_confirmed")),
    idempotency_key: `phase3a:${state.user.id}:${state.asset.id}:${state.analysisId}`,
    client_context: { app: "open-video-studio", platform: "phase3a-reference-studio" },
  };
  $("[data-plan-submit]").disabled = true;
  try {
    const response = await createGatewayGeneration(input);
    state.job = response.job;
    localStorage.setItem(`phase3a:last-job:${state.user.id}`, response.job.id);
    renderJob(response.job);
    markStep("plan");
    const result = await waitForGatewayGeneration(response.job.id, { timeoutMs: 60_000, intervalMs: 400, onStatus: renderJob });
    state.job = result.job;
    renderJob(result.job);
  } catch (error) {
    if (error.job) renderJob(error.job);
    toast(error.message || "Mock 任务创建失败。");
  } finally {
    updatePlanReady();
  }
}

async function restoreJob() {
  const jobId = localStorage.getItem(`phase3a:last-job:${state.user.id}`);
  if (!jobId) return;
  try {
    const response = await getGatewayGeneration(jobId);
    state.job = response.job;
    renderJob(response.job);
  } catch {
    localStorage.removeItem(`phase3a:last-job:${state.user.id}`);
  }
}
async function refreshJob() {
  if (!state.job?.id) return;
  try {
    const response = await getGatewayGeneration(state.job.id);
    state.job = response.job;
    renderJob(response.job);
  } catch (error) { toast(error.message || "刷新任务失败。"); }
}
function renderJob(job) {
  if (!job) return;
  state.job = job;
  $("[data-job-empty]").hidden = true;
  $("[data-job-view]").hidden = false;
  $("[data-refresh-job]").hidden = false;
  $("[data-job-id]").textContent = job.id;
  setChip("[data-job-status]", statusLabel(job.status));
  const currentIndex = timeline.indexOf(job.status);
  $("[data-job-timeline]").innerHTML = timeline.map((status, index) => `<li class="${index <= currentIndex || job.status === "completed" ? "reached" : ""}">${statusLabel(status)}</li>`).join("");
  $("[data-result-gallery]").innerHTML = (job.assets || []).map((asset) => `<img src="${escapeHtml(asset.preview_url || asset.url)}" alt="Phase 3A Mock 生成结果">`).join("");
  if (TERMINAL.has(job.status)) markStep("result");
}

async function loadRegistries() {
  $("[data-registry-access]").textContent = "admin/operator";
  try {
    const [workflowResponse, loraResponse] = await Promise.all([listGatewayWorkflows(), listGatewayLoras()]);
    renderWorkflowRegistry(workflowResponse.workflows || []);
    renderLoraRegistry(loraResponse.loras || [], loraResponse.compatibility || []);
  } catch (error) {
    $("[data-workflow-registry]").innerHTML = `<div class="empty-state"><strong>Registry 加载失败</strong><p>${escapeHtml(error.message || "未知错误")}</p></div>`;
  }
}

function renderWorkflowRegistry(workflows) {
  $("[data-workflow-registry]").innerHTML = workflows.map((workflow) => {
    const tags = [...workflow.capability.media_types, ...workflow.capability.creation_modes,
      workflow.capability.accepts_reference_image ? "reference" : "",
      workflow.capability.supports_character ? "character" : "",
      workflow.capability.supports_pose_preservation ? "pose" : ""].filter(Boolean);
    return `
      <article class="registry-card" data-workflow-card="${escapeHtml(workflow.id)}">
        <div class="registry-card-head"><div><h3>${escapeHtml(workflow.id)}</h3><code>当前版本 ${escapeHtml(workflow.version)}</code></div><span class="status-chip">${statusLabel(workflow.status)}</span></div>
        <div class="capability-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="registry-controls">
          <label>状态<select data-workflow-status>${statusOptions(workflow.status)}</select></label>
          <label>新版本<input data-workflow-version value="${escapeHtml(workflow.version)}" pattern="\\d+\\.\\d+\\.\\d+"></label>
          <button type="button" data-save-workflow="${escapeHtml(workflow.id)}">保存状态/版本</button>
          <button type="button" data-workflow-history="${escapeHtml(workflow.id)}">查看历史</button>
        </div>
        <div class="version-history" data-workflow-history-view hidden></div>
      </article>`;
  }).join("");
  $$("[data-save-workflow]").forEach((button) => button.addEventListener("click", () => saveWorkflow(button.dataset.saveWorkflow)));
  $$("[data-workflow-history]").forEach((button) => button.addEventListener("click", () => showWorkflowHistory(button.dataset.workflowHistory)));
}

function renderLoraRegistry(loras, compatibility) {
  $("[data-lora-registry]").innerHTML = loras.map((lora) => {
    const links = compatibility.filter((item) => item.lora_id === lora.id);
    return `
      <article class="registry-card" data-lora-card="${escapeHtml(lora.id)}">
        <div class="registry-card-head"><div><h3>${escapeHtml(lora.name || lora.id)}</h3><code>${escapeHtml(lora.id)} · ${escapeHtml(lora.version)}</code></div><span class="status-chip">${statusLabel(lora.status)}</span></div>
        <div class="capability-tags"><span>${escapeHtml(lora.base_architecture || "unknown")}</span>
          ${(lora.compatible_model_ids || []).map((id) => `<span>${escapeHtml(id)}</span>`).join("")}
          ${links.map((item) => `<span>${escapeHtml(item.workflow_id)} · ${statusLabel(item.status)}</span>`).join("")}</div>
        <div class="registry-controls">
          <label>状态<select data-lora-status>${statusOptions(lora.status)}</select></label>
          <label>默认权重<input type="number" step="0.05" min="-2" max="2" data-lora-default value="${Number(lora.default_weight)}"></label>
          <label>最小权重<input type="number" step="0.05" min="-2" max="2" data-lora-min value="${Number(lora.min_weight)}"></label>
          <label>最大权重<input type="number" step="0.05" min="-2" max="2" data-lora-max value="${Number(lora.max_weight)}"></label>
          <button type="button" data-save-lora="${escapeHtml(lora.id)}">保存配置</button>
          <button type="button" data-lora-history="${escapeHtml(lora.id)}">查看历史</button>
        </div>
        <div class="version-history" data-lora-history-view hidden></div>
      </article>`;
  }).join("");
  $$("[data-save-lora]").forEach((button) => button.addEventListener("click", () => saveLora(button.dataset.saveLora)));
  $$("[data-lora-history]").forEach((button) => button.addEventListener("click", () => showLoraHistory(button.dataset.loraHistory)));
}

async function saveWorkflow(id) {
  const card = $(`[data-workflow-card="${CSS.escape(id)}"]`);
  try {
    await patchGatewayWorkflow(id, { status: card.querySelector("[data-workflow-status]").value, version: card.querySelector("[data-workflow-version]").value.trim() });
    toast("Workflow 状态与版本已保存，旧配置已归档。");
    await loadRegistries();
  } catch (error) { toast(error.message || "Workflow 保存失败。"); }
}
async function saveLora(id) {
  const card = $(`[data-lora-card="${CSS.escape(id)}"]`);
  try {
    await patchGatewayLora(id, {
      status: card.querySelector("[data-lora-status]").value,
      default_weight: Number(card.querySelector("[data-lora-default]").value),
      min_weight: Number(card.querySelector("[data-lora-min]").value),
      max_weight: Number(card.querySelector("[data-lora-max]").value),
    });
    toast("LoRA Registry 配置已保存，旧配置已归档。");
    await loadRegistries();
  } catch (error) { toast(error.message || "LoRA 保存失败。"); }
}
async function showWorkflowHistory(id) {
  const view = $(`[data-workflow-card="${CSS.escape(id)}"] [data-workflow-history-view]`);
  try {
    const response = await listGatewayWorkflowVersions(id);
    view.hidden = false;
    view.innerHTML = historyMarkup(response.versions || []);
  } catch (error) { toast(error.message || "版本历史加载失败。"); }
}
async function showLoraHistory(id) {
  const view = $(`[data-lora-card="${CSS.escape(id)}"] [data-lora-history-view]`);
  try {
    const response = await listGatewayLoraVersions(id);
    view.hidden = false;
    view.innerHTML = historyMarkup(response.versions || []);
  } catch (error) { toast(error.message || "版本历史加载失败。"); }
}
function historyMarkup(items) {
  return items.length ? items.map((item) => `版本 ${escapeHtml(item.version || "-")} · ${escapeHtml(formatTime(item.created_at))}`).join("<br>") : "暂无历史修订。";
}
function switchRegistryTab(tab) {
  $$("[data-registry-tab]").forEach((button) => button.classList.toggle("active", button.dataset.registryTab === tab));
  $("[data-workflow-registry]").hidden = tab !== "workflows";
  $("[data-lora-registry]").hidden = tab !== "loras";
}

function markStep(name, done = true) { const item = $(`[data-step-indicator="${name}"]`); item?.classList.add(done ? "done" : "active"); }
function selectedCharacter() { return state.characters.find((item) => item.id === state.selectedCharacterId) || null; }
function setSessionStatus(title, detail, ready) {
  const box = $("[data-session-status]");
  box.classList.toggle("ready", ready);
  box.querySelector("strong").textContent = title;
  box.querySelector("small").textContent = detail;
}
function disableWorkspace(disabled) { $$("main input, main textarea, main select, main button").forEach((control) => { control.disabled = disabled; }); }
function setChip(selector, text) { const item = $(selector); if (item) item.textContent = text; }
function nullable(value) { const text = String(value || "").trim(); return text || null; }
function statusOptions(selected) {
  return ["draft", "testing", "production", "deprecated", "disabled"].map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${statusLabel(status)}</option>`).join("");
}
function statusLabel(status) {
  return ({ draft: "草稿", testing: "测试中", production: "可用", deprecated: "已弃用", disabled: "已停用", queued: "排队", submitted: "已提交", running: "生成中", post_processing: "后处理", reviewing: "审核中", completed: "已完成", failed: "失败", cancelled: "已取消" })[status] || String(status || "未知");
}
function imageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { resolve({ width: image.naturalWidth, height: image.naturalHeight }); URL.revokeObjectURL(url); };
    image.onerror = () => { reject(new Error("无法读取图片尺寸。")); URL.revokeObjectURL(url); };
    image.src = url;
  });
}
function formatBytes(bytes) { return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`; }
function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN") : "未知时间"; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
let toastTimer;
function toast(message) {
  const item = $("[data-toast]");
  item.textContent = message;
  item.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { item.hidden = true; }, 4200);
}
