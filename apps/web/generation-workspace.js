import { getSession } from "./auth-service.js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase-client.js";
import { saveUserCreation } from "./user-account-service.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 10 * 1024 * 1024;
const G20_WORKFLOW_ID = "workflow-zealman-video-g20-v1";
const G20_BASE_CREDIT_COST = 24;
const MIN_IMAGE_EDGE = 256;
const MAX_IMAGE_EDGE = 8192;
const ACTIVE_TASK_STATUSES = new Set(["uploading", "queued", "pending", "processing", "running", "model_preparing", "generating", "post_processing", "uploading_result", "cancelling"]);
const TERMINAL_TASK_STATUSES = new Set(["completed", "succeeded", "failed", "cancelled", "canceled", "restricted", "timed_out", "timeout"]);
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EDITOR_SLOT_DEFINITIONS = Object.freeze([
  { key: "main", label: "主图片", description: "需要编辑的原始图片", aliases: ["image", "main_image", "mainImage", "source_image", "sourceImage", "sourceImageUrl"] },
  { key: "face", label: "参考脸", description: "用于保持或参考面部特征", aliases: ["reference_face", "face_reference", "referenceFace", "faceImage", "face_image"] },
  { key: "outfit", label: "参考服装", description: "用于参考服装款式和材质", aliases: ["reference_outfit", "outfit_reference", "referenceOutfit", "outfitImage", "outfit_image"] },
  { key: "scene", label: "参考场景", description: "用于参考背景、环境和光线", aliases: ["reference_scene", "scene_reference", "referenceScene", "sceneImage", "scene_image"] },
]);
const IMAGE_EDITOR_OPERATIONS = Object.freeze([
  { id: "remove_background", label: "移除背景", prompt: "移除图片背景，保留主体边缘和细节，输出干净的透明或纯色背景。" },
  { id: "replace_background", label: "更换背景", prompt: "更换图片背景，并保持主体的光线、透视、边缘和整体风格自然一致。" },
  { id: "change_outfit", label: "更换服装", prompt: "更换人物服装，保持人物身份、姿势、面部和场景不变，使服装材质与光线自然。" },
  { id: "improve_lighting", label: "改善光线", prompt: "改善图片光线与曝光，恢复高光和阴影细节，保持自然肤色和真实质感。" },
  { id: "repair_face", label: "修复脸部", prompt: "修复面部细节与清晰度，保持人物身份、表情和自然皮肤纹理不变。" },
  { id: "change_pose", label: "改变姿势", prompt: "调整人物姿势，同时保持人物身份、服装、场景和画面风格一致。" },
  { id: "outpaint", label: "扩展画面", prompt: "向画面外自然扩展内容，延续原有场景、光线、透视和视觉风格。" },
  { id: "custom", label: "自定义编辑", prompt: "" },
]);

const FACE_SWAP_SLOT_DEFINITIONS = Object.freeze([
  { key: "source", label: "源人脸", description: "只上传一张正面、清晰、已获授权的人脸图片" },
  { key: "target", label: "目标图片", description: "上传需要替换人脸的目标图片；支持服务端多人脸选择" },
]);

const OUTFIT_PRESETS = Object.freeze([
  { effect_id: "outfit-business", name: "商务正装", category: "正装", preview: "", prompt_template: "为人物更换为简洁得体的商务正装，保持人物身份、姿势、背景与光线一致。", workflow_id: "workflow-hifun-outfit-v1", credit_cost: 12, status: "preview_only", featured: true, created_at: "2026-07-01" },
  { effect_id: "outfit-street", name: "日常街拍", category: "日常", preview: "", prompt_template: "为人物更换为自然的日常街拍服装，保持人物身份、姿势、背景与光线一致。", workflow_id: "workflow-hifun-outfit-v1", credit_cost: 12, status: "preview_only", featured: true, created_at: "2026-07-02" },
  { effect_id: "outfit-evening", name: "晚宴礼服", category: "正装", preview: "", prompt_template: "为人物更换为适合正式晚宴的礼服，保持人物身份、姿势、背景与光线一致。", workflow_id: "workflow-hifun-outfit-v1", credit_cost: 16, status: "preview_only", featured: false, created_at: "2026-07-03" },
  { effect_id: "outfit-social", name: "社媒时尚", category: "日常", preview: "", prompt_template: "为人物更换为适合社交媒体展示的时尚服装，保持人物身份、姿势与场景一致。", workflow_id: "workflow-hifun-outfit-v1", credit_cost: 12, status: "preview_only", featured: false, created_at: "2026-07-04" },
  { effect_id: "outfit-lingerie", name: "内衣造型", category: "内衣", preview: "", prompt_template: "为成年虚构或已获授权人物更换为合规内衣造型，保持人物身份与自然光线。", workflow_id: "workflow-hifun-outfit-v1", credit_cost: 16, status: "preview_only", featured: false, created_at: "2026-07-05" },
  { effect_id: "outfit-custom", name: "自定义服装", category: "自定义", preview: "", prompt_template: "", workflow_id: "workflow-hifun-outfit-v1", credit_cost: null, status: "preview_only", featured: false, created_at: "2026-07-06" },
]);

const POSE_PRESETS = Object.freeze([
  { effect_id: "pose-standing", name: "自然站姿", category: "单人", preview: "", prompt_template: "人物自然站立，正面视角，全身构图，保持人物身份、服装和场景一致。", workflow_id: "workflow-hifun-pose-v1", credit_cost: 8, status: "preview_only", featured: true, created_at: "2026-07-01", people: "单人", orientation: "正面" },
  { effect_id: "pose-action", name: "动态姿势", category: "单人", preview: "", prompt_template: "人物呈自然动态姿势，侧面视角，中景构图，保持人物身份、服装和场景一致。", workflow_id: "workflow-hifun-pose-v1", credit_cost: 8, status: "preview_only", featured: true, created_at: "2026-07-02", people: "单人", orientation: "侧面" },
  { effect_id: "pose-camera", name: "镜头表现", category: "单人", preview: "", prompt_template: "人物面向镜头呈自然姿势，正面视角，电影感中景构图。", workflow_id: "workflow-hifun-pose-v1", credit_cost: 8, status: "preview_only", featured: false, created_at: "2026-07-03", people: "单人", orientation: "正面" },
  { effect_id: "pose-custom", name: "自定义姿势", category: "自定义", preview: "", prompt_template: "", workflow_id: "workflow-hifun-pose-v1", credit_cost: null, status: "preview_only", featured: false, created_at: "2026-07-04", people: "单人", orientation: "自定义" },
]);

const VIDEO_EFFECTS = Object.freeze([
  {
    effect_id: "video-g20",
    name: "AI 图片转视频",
    category: "图片转视频",
    poster: "",
    preview_video_url: "",
    prompt_template: "",
    workflow_id: G20_WORKFLOW_ID,
    credit_cost: G20_BASE_CREDIT_COST,
    status: "preview_only",
    featured: true,
    created_at: "2026-07-26",
    durations: [2, 3, 4, 5, 6, 8, 10],
    estimated_time: "以实时队列为准",
  },
]);

const TOOL_DEFINITIONS = Object.freeze({
  "image-generate": {
    name: "AI 图片生成",
    description: "输入画面描述，可选上传一张参考图。仅在图片生成工作流完成真实验证后开放创建。",
    mediaType: "image",
    promptLabel: "画面描述",
    promptPlaceholder: "例如：清晨海边的现代玻璃屋，柔和自然光，真实摄影质感",
    minFiles: 0,
    maxFiles: 1,
    requireFace: false,
    outputLabel: "生成图片",
    uploadOptional: true,
    e2eVerified: false,
    examples: [
      "清晨海边的现代玻璃屋，柔和自然光，真实摄影质感，细节清晰",
      "雨夜城市街道，霓虹灯倒影，电影感构图，真实摄影风格",
      "极简产品静物摄影，柔和棚拍光线，干净背景，高级商业质感",
    ],
  },
  "image-editor": {
    name: "自然语言图片编辑",
    description: "上传一张图片，用自然语言说明需要修改的内容。",
    mediaType: "image",
    promptLabel: "编辑描述",
    promptPlaceholder: "例如：移除背景中的路人，并保持主体细节清晰",
    minFiles: 1,
    maxFiles: 1,
    requireFace: false,
    outputLabel: "图片结果",
    e2eVerified: false,
    examples: [
      "移除背景中的路人，保持主体、光线和构图不变",
      "把背景改成干净的摄影棚，保留人物面部和服装细节",
      "改善曝光和肤色，恢复阴影细节，保持真实质感",
    ],
  },
  "image-combiner": {
    name: "多图编辑",
    description: "上传主图和至少一张参考图，用自然语言说明组合关系。",
    mediaType: "image",
    promptLabel: "编辑描述",
    promptPlaceholder: "例如：保留主图人物，把参考图中的服装和场景自然融合到主图",
    minFiles: 2,
    maxFiles: 2,
    requireFace: false,
    outputLabel: "多图编辑结果",
    e2eVerified: true,
    examples: [
      "保留第一张图的人物，把第二张图的服装自然应用到人物身上",
      "以第一张图为主体，参考第二张图的场景和第三张图的光线",
      "将多张产品参考图组合为统一光线和透视的商业画面",
    ],
  },
  "image-upscale": {
    name: "图片高清修复",
    description: "上传一张图片进行清晰度与细节修复。仅在高清修复工作流真实验证后开放创建。",
    mediaType: "image",
    promptLabel: "修复要求（可选）",
    promptPlaceholder: "例如：增强细节和清晰度，减少噪点，保持原图构图与人物身份",
    minFiles: 1,
    maxFiles: 1,
    requireFace: false,
    outputLabel: "高清修复结果",
    promptOptional: true,
    e2eVerified: false,
    examples: [
      "增强细节和清晰度，减少噪点，保持原图构图不变",
      "修复面部与发丝细节，保持人物身份和自然皮肤纹理",
      "改善低光画面的清晰度和色彩，避免过度锐化",
    ],
  },
  "face-swap": {
    name: "AI 换脸",
    description: "上传源脸与目标图片，仅处理虚构角色或已获授权素材。",
    mediaType: "image",
    promptLabel: "融合要求",
    promptPlaceholder: "例如：自然融合，保持目标人物的光线和表情",
    minFiles: 2,
    maxFiles: 2,
    requireFace: true,
    outputLabel: "换脸结果",
    e2eVerified: false,
  },
  "outfit-studio": {
    name: "性感礼服",
    description: "为成年虚构角色或已获授权人物调整服装与造型。",
    mediaType: "image",
    promptLabel: "服装描述",
    promptPlaceholder: "描述服装款式、材质、颜色和使用场景",
    minFiles: 1,
    maxFiles: 1,
    requireFace: false,
    outputLabel: "服装结果",
    e2eVerified: false,
  },
  "pose-generator": {
    name: "性爱姿势",
    description: "为成年虚构角色或已获授权人物选择姿势与镜头参考。",
    mediaType: "image",
    promptLabel: "姿势描述",
    promptPlaceholder: "描述姿势、镜头角度和构图；禁止涉及未成年人或未经同意的真人素材",
    minFiles: 1,
    maxFiles: 1,
    requireFace: false,
    outputLabel: "姿势结果",
    e2eVerified: false,
  },
  "image-to-video": {
    name: "图片转视频",
    description: "上传一张首帧图片并描述动作，使用 G20 图片转视频生成短视频。",
    mediaType: "video",
    promptLabel: "视频描述",
    promptPlaceholder: "例如：镜头缓慢推进，主体自然转身，动作连续",
    minFiles: 1,
    maxFiles: 1,
    requireFace: false,
    outputLabel: "视频结果",
    videoOptions: true,
    e2eVerified: false,
  },
});

const STATUS_COPY = Object.freeze({
  queued: "排队中",
  processing: "生成中",
  running: "生成中",
  pending: "等待队列",
  model_preparing: "模型准备",
  generating: "生成中",
  post_processing: "后处理",
  uploading_result: "上传结果",
  completed: "已完成",
  succeeded: "已完成",
  failed: "失败",
  timed_out: "任务超时",
  timeout: "任务超时",
  cancelled: "已取消",
  canceled: "已取消",
  restricted: "未通过内容检查",
});

const state = {
  toolId: "",
  tool: null,
  files: [],
  uploaderStatus: "idle",
  uploaderMessage: "",
  session: null,
  balance: null,
  catalogTool: null,
  workflow: null,
  jobs: [],
  refunds: new Map(),
  currentTask: null,
  submitLocked: false,
  pollTimer: null,
  localTask: null,
  editorMode: "single",
  editorOperation: "custom",
  editorActiveSlot: "main",
  editorSlots: { main: null, face: null, outfit: null, scene: null },
  promptHistory: [],
  faceSwapSlots: { source: null, target: null },
  faceActiveSlot: "source",
  faceTargetCount: null,
  faceTargetIndex: 0,
  outfitMode: "preset",
  poseMode: "simple",
  selectedEffect: null,
  effectPickerOpen: false,
  effectPickerQuery: "",
  effectPickerCategory: "全部",
  effectPickerSort: "热门",
  qaActivePresets: false,
  uploadPurpose: "primary",
  referenceOutfit: null,
  videoPrice: null,
};

const root = document.querySelector("[data-generation-tool-page]");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getToolId() {
  const declared = root?.dataset.toolId || document.body.dataset.toolId;
  const params = new URLSearchParams(window.location.search);
  const query = params.get("tool");
  if (declared === "image-editor" && params.get("operation") === "upscale") return "image-upscale";
  return TOOL_DEFINITIONS[declared] ? declared : TOOL_DEFINITIONS[query] ? query : "image-editor";
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "未知时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeStatus(value) {
  const status = String(value || "").toLowerCase();
  if (["uploading", "running", "model_preparing", "generating", "post_processing", "uploading_result", "cancelling"].includes(status)) return "processing";
  if (status === "succeeded") return "completed";
  if (["timed_out", "timeout"].includes(status)) return "failed";
  if (status === "canceled") return "cancelled";
  return status || "queued";
}

function getTaskStage(task) {
  const rawStatus = String(task?.status || "").toLowerCase();
  const explicit = String(task?.input_params?.stage || task?.stage || "").toLowerCase();
  const key = explicit || rawStatus;
  const stages = {
    uploading: "上传中",
    queued: "等待队列",
    pending: "等待队列",
    model_preparing: "模型准备",
    preparing: "模型准备",
    running: "生成中",
    processing: "生成中",
    generating: "生成中",
    post_processing: "后处理",
    postprocessing: "后处理",
    uploading_result: "上传结果",
    uploading_output: "上传结果",
    cancelling: "正在取消",
    completed: "完成",
    failed: "失败",
    timed_out: "任务超时",
    timeout: "任务超时",
  };
  return stages[key] || (task?.input_params?.stage ? String(task.input_params.stage) : STATUS_COPY[rawStatus] || "服务端处理中");
}

function getTaskResultUrl(task) {
  if (!task) return "";
  if (task.result_url) return String(task.result_url);
  const outputAssets = Array.isArray(task.output_assets) ? task.output_assets : [];
  const first = outputAssets.find((asset) => asset && (asset.url || asset.output_url || asset.preview_url));
  return String(first?.url || first?.output_url || first?.preview_url || "");
}

function hasConfiguredWorkflow() {
  if (state.tool?.e2eVerified === false) return false;
  if (!state.catalogTool || !state.workflow) return false;
  const status = String(state.workflow.status || "").toLowerCase();
  const inputSchema = state.workflow.input_schema;
  const outputSchema = state.workflow.output_schema;
  return (
    ["active", "published"].includes(status) &&
    Boolean(state.workflow.workflow_id) &&
    inputSchema &&
    Object.keys(inputSchema).length > 0 &&
    outputSchema &&
    Object.keys(outputSchema).length > 0
  );
}

function getConfiguredCost() {
  if (state.toolId === "image-to-video") return calculateVideoCost();
  const tool = state.catalogTool;
  const candidates = [tool?.credits_cost, tool?.cost_per_run, state.workflow?.cost];
  const cost = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0);
  return cost || null;
}

function getWorkflowInputKeys() {
  const schema = state.workflow?.input_schema;
  if (!schema || typeof schema !== "object") return [];
  const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : schema;
  return Object.keys(properties);
}

function schemaSupportsAny(aliases) {
  const keys = new Set(getWorkflowInputKeys());
  return aliases.some((alias) => keys.has(alias));
}

function getWorkflowInputProperty(aliases) {
  const schema = state.workflow?.input_schema;
  if (!schema || typeof schema !== "object") return null;
  const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : schema;
  const key = aliases.find((alias) => Object.prototype.hasOwnProperty.call(properties, alias));
  return key ? { key, schema: properties[key] || {} } : null;
}

function getSchemaOptions(definition, fallback = []) {
  const values = Array.isArray(definition?.schema?.enum)
    ? definition.schema.enum
    : Array.isArray(definition?.schema?.options)
      ? definition.schema.options
      : [];
  return values.length ? values : fallback;
}

function getVideoParameterSupport() {
  if (state.toolId !== "image-to-video") return {};
  const fallback = {
    duration: { key: "durationSeconds", schema: { type: "integer", enum: [2, 3, 4, 5, 6, 8, 10], default: 5 } },
    resolution: { key: "resolution", schema: { type: "integer", enum: [512, 768, 1024], default: 1024 } },
    seed: { key: "seed", schema: { type: "integer", minimum: 0, maximum: 4294967295, default: "random" } },
    fps: { key: "fps", schema: { type: "integer", enum: [24], default: 24, readOnly: true } },
  };
  return {
    duration: getWorkflowInputProperty(["durationSeconds", "duration_seconds", "duration"]) || fallback.duration,
    aspectRatio: getWorkflowInputProperty(["aspectRatio", "aspect_ratio", "output_ratio"]),
    cameraMotion: getWorkflowInputProperty(["cameraMotion", "camera_motion"]),
    motionStrength: getWorkflowInputProperty(["motionStrength", "motion_strength"]),
    faceStability: getWorkflowInputProperty(["faceStability", "face_stability", "stabilize_face"]),
    loop: getWorkflowInputProperty(["loop", "is_loop", "seamless_loop"]),
    resolution: getWorkflowInputProperty(["resolution", "quality"]) || fallback.resolution,
    outputCount: getWorkflowInputProperty(["outputCount", "output_count", "video_count"]),
    seed: getWorkflowInputProperty(["seed", "random_seed"]) || fallback.seed,
    fps: getWorkflowInputProperty(["fps", "frameRate", "frame_rate"]) || fallback.fps,
    negativePrompt: getWorkflowInputProperty(["negativePrompt", "negative_prompt"]),
  };
}

function getVideoPricingConfig() {
  const schema = state.workflow?.input_schema;
  if (!schema || typeof schema !== "object") return {};
  return schema.pricing && typeof schema.pricing === "object"
    ? schema.pricing
    : schema["x-pricing"] && typeof schema["x-pricing"] === "object"
      ? schema["x-pricing"]
      : {};
}

function calculateVideoCost() {
  if (state.toolId !== "image-to-video") return null;
  const effect = getSelectedEffect();
  const configuredBase = [effect?.credit_cost, state.catalogTool?.credits_cost, state.catalogTool?.cost_per_run, state.workflow?.cost]
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0);
  const baseCost = configuredBase || (
    effect?.workflow_id === G20_WORKFLOW_ID ? G20_BASE_CREDIT_COST : null
  );
  if (!baseCost) return null;
  const pricing = getVideoPricingConfig();
  const duration = String(root?.querySelector("[data-video-duration]")?.value || "");
  const resolution = String(root?.querySelector("[data-video-resolution]")?.value || "");
  const outputCount = String(root?.querySelector("[data-video-output-count]")?.value || "1");
  const durationCosts = pricing.duration_costs && typeof pricing.duration_costs === "object" ? pricing.duration_costs : {};
  const resolutionMultipliers = pricing.resolution_multipliers && typeof pricing.resolution_multipliers === "object" ? pricing.resolution_multipliers : {};
  const outputMultipliers = pricing.output_multipliers && typeof pricing.output_multipliers === "object" ? pricing.output_multipliers : {};
  const durationCost = Number(durationCosts[duration]);
  const resolutionMultiplier = Number(resolutionMultipliers[resolution]);
  const outputMultiplier = Number(outputMultipliers[outputCount]);
  const cost = (Number.isFinite(durationCost) && durationCost > 0 ? durationCost : baseCost)
    * (Number.isFinite(resolutionMultiplier) && resolutionMultiplier > 0 ? resolutionMultiplier : 1)
    * (Number.isFinite(outputMultiplier) && outputMultiplier > 0 ? outputMultiplier : 1);
  return Math.max(1, Math.ceil(cost));
}

function getSupportedEditorSlots() {
  if (state.toolId !== "image-editor") return [];
  const keys = getWorkflowInputKeys();
  const hasPublishedSchema = keys.length > 0;
  return IMAGE_EDITOR_SLOT_DEFINITIONS.filter((slot) => {
    if (slot.key === "main") return true;
    return hasPublishedSchema && schemaSupportsAny(slot.aliases);
  });
}

function getSupportedEditorOutputs() {
  if (state.toolId !== "image-editor") return [];
  const definitions = [
    { id: "aspectRatio", label: "输出比例", aliases: ["aspectRatio", "aspect_ratio"], type: "select", options: [["source", "跟随原图"], ["1:1", "1:1"], ["4:3", "4:3"], ["3:4", "3:4"], ["16:9", "16:9"], ["9:16", "9:16"]] },
    { id: "imageCount", label: "输出数量", aliases: ["imageCount", "image_count", "imgCount"], type: "select", options: [["1", "1 张"], ["2", "2 张"], ["4", "4 张"]] },
    { id: "resolution", label: "清晰度", aliases: ["resolution", "quality"], type: "select", options: [["standard", "标准"], ["high", "高清"]] },
    { id: "preserveFace", label: "保留人脸", aliases: ["preserveFace", "preserve_face", "restoreFaces"], type: "checkbox" },
    { id: "creativity", label: "创意强度", aliases: ["creativity", "creative_strength", "denoise"], type: "range" },
  ];
  return definitions.filter((definition) => schemaSupportsAny(definition.aliases));
}

function loadPromptHistory() {
  if (state.toolId !== "image-editor") return;
  try {
    const value = JSON.parse(localStorage.getItem("luravyn:image-editor:prompt-history") || "[]");
    state.promptHistory = Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(0, 8) : [];
  } catch {
    state.promptHistory = [];
  }
}

function savePromptHistory(prompt) {
  const value = String(prompt || "").trim();
  if (state.toolId !== "image-editor" || !value) return;
  state.promptHistory = [value, ...state.promptHistory.filter((item) => item !== value)].slice(0, 8);
  try {
    localStorage.setItem("luravyn:image-editor:prompt-history", JSON.stringify(state.promptHistory));
  } catch {
    // Local prompt history is optional; generation must continue if storage is unavailable.
  }
}

function renderImageEditorMode() {
  if (state.toolId !== "image-editor") return "";
  return `
    <section class="workspace-panel image-editor-mode-panel">
      <div class="workspace-panel-heading">
        <div><span class="workspace-step">模式</span><h2>单图自然语言编辑</h2></div>
      </div>
      <p class="workspace-field-message" data-editor-mode-message>本页使用一张主图片。需要组合多张参考图时，请使用“多图编辑”。</p>
      <a class="workspace-inline-link" href="./image-combiner.html">前往多图编辑</a>
    </section>
  `;
}

function renderImageEditorPromptControls() {
  if (state.toolId !== "image-editor") return "";
  return `
    <div class="image-editor-intent">
      <strong>快捷操作</strong>
      <div class="image-editor-operation-grid">
        ${IMAGE_EDITOR_OPERATIONS.map((operation) => `
          <button type="button" class="${operation.id === "custom" ? "is-active" : ""}" data-editor-operation="${operation.id}">
            ${escapeHtml(operation.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderImageEditorPromptFooter() {
  if (state.toolId !== "image-editor") return "";
  return `
    <div class="image-editor-prompt-tools">
      <button type="button" class="workspace-button secondary" data-optimize-prompt>优化描述</button>
      <button type="button" class="workspace-button ghost" data-clear-prompt>清空</button>
      <label>
        <span>历史提示词</span>
        <select data-prompt-history>
          <option value="">选择历史记录</option>
          ${state.promptHistory.map((prompt, index) => `<option value="${index}">${escapeHtml(prompt.slice(0, 44))}</option>`).join("")}
        </select>
      </label>
      <span data-prompt-count>0 / 1200</span>
    </div>
    <p class="workspace-field-message">支持中文输入；提交时会按标准 operation 与 prompt 字段发送。不会向页面展示内部 system prompt。</p>
  `;
}

function renderPromptExamples() {
  const examples = Array.isArray(state.tool?.examples) ? state.tool.examples : [];
  if (!examples.length) return "";
  return `
    <div class="workspace-prompt-examples">
      <strong>示例参数</strong>
      <div>
        ${examples.map((example) => `
          <button type="button" data-prompt-example="${escapeHtml(example)}">${escapeHtml(example)}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function getToolPresets() {
  const source = state.toolId === "outfit-studio"
    ? OUTFIT_PRESETS
    : state.toolId === "pose-generator"
      ? POSE_PRESETS
      : state.toolId === "image-to-video"
        ? VIDEO_EFFECTS
        : [];
  return source.map((item) => state.qaActivePresets
    ? { ...item, status: "active", workflow_id: state.workflow?.workflow_id || item.workflow_id, credit_cost: item.credit_cost || Number(state.catalogTool?.credits_cost) || 24, durations: item.durations?.length ? item.durations : [2, 5, 10], estimated_time: item.estimated_time || "约 1–3 分钟" }
    : { ...item });
}

function getSelectedEffect() {
  return getToolPresets().find((item) => item.effect_id === state.selectedEffect) || null;
}

function renderFaceSwapUploader() {
  if (state.toolId !== "face-swap") return "";
  return `
    <div class="face-swap-pair" data-face-swap-pair>
      ${FACE_SWAP_SLOT_DEFINITIONS.map((slot, index) => `
        ${index ? `<span class="face-swap-arrow" aria-hidden="true">→</span>` : ""}
        <button type="button" class="face-swap-slot" data-face-slot="${slot.key}">
          <span class="face-swap-slot-preview" data-face-preview="${slot.key}">＋</span>
          <strong>${slot.label}</strong>
          <small>${slot.description}</small>
        </button>
      `).join("")}
    </div>
    <div class="face-target-picker" data-face-target-picker hidden>
      <strong>选择目标人物</strong>
      <p>目标图检测到多张人脸，请确认要替换的人物。编号按从左到右排列。</p>
      <div data-face-target-options></div>
    </div>
    <p class="workspace-privacy-note">源人脸只用于身份参考，目标图片决定姿势、构图和背景。仅上传本人、虚构角色或已获明确授权的素材。</p>
  `;
}

function renderToolModeControls() {
  if (state.toolId === "face-swap") {
    const supportsHair = schemaSupportsAny(["preserveHair", "preserve_hair"]);
    const supportsExpression = schemaSupportsAny(["preserveExpression", "preserve_expression"]);
    const supportsFusion = schemaSupportsAny(["fusionStrength", "fusion_strength"]);
    if (!supportsHair && !supportsExpression && !supportsFusion) {
      return `<p class="workspace-capability-note">当前发布工作流未公开“保留发型、保留表情、融合强度”参数，因此页面不会伪造这些选项。</p>`;
    }
    return `
      <fieldset class="tool-option-fieldset">
        <legend>融合设置</legend>
        ${supportsHair ? `<label><input type="checkbox" data-face-option="preserveHair" checked> 保留目标发型</label>` : ""}
        ${supportsExpression ? `<label><input type="checkbox" data-face-option="preserveExpression" checked> 保留目标表情</label>` : ""}
        ${supportsFusion ? `<label class="workspace-field"><span>融合强度</span><input type="range" min="0" max="100" value="75" data-face-option="fusionStrength"><small data-face-fusion-value>75</small></label>` : ""}
      </fieldset>
    `;
  }
  if (state.toolId === "outfit-studio") {
    const referenceSupported = schemaSupportsAny(["reference_outfit", "referenceOutfit", "outfit_image"]);
    return `
      <div class="tool-mode-tabs" role="tablist" aria-label="服装变换方式">
        <button type="button" class="is-active" role="tab" data-outfit-mode="preset">服装预设</button>
        <button type="button" role="tab" data-outfit-mode="reference" ${referenceSupported ? "" : "disabled"} title="${referenceSupported ? "" : "当前工作流未公开参考服装输入"}">参考服装</button>
        <button type="button" role="tab" data-outfit-mode="custom">自定义描述</button>
      </div>
      <button type="button" class="effect-selection-summary" data-open-effect-picker>
        <span data-selected-effect-copy>选择服装预设</span><span>›</span>
      </button>
      <div class="reference-outfit-panel" data-reference-outfit-panel hidden>
        <p>${referenceSupported ? "上传人物图后，再选择一张参考服装图片。" : "当前生产工作流只有一张人物图输入，参考服装上传尚未开放。"}</p>
        <button type="button" class="workspace-button secondary" data-reference-outfit-upload ${referenceSupported ? "" : "disabled"}>上传参考服装</button>
      </div>
    `;
  }
  if (state.toolId === "pose-generator") {
    return `
      <div class="tool-mode-tabs" role="tablist" aria-label="姿势生成方式">
        <button type="button" class="is-active" role="tab" data-pose-mode="simple">简单模式</button>
        <button type="button" role="tab" data-pose-mode="custom">自定义模式</button>
      </div>
      <button type="button" class="effect-selection-summary" data-open-effect-picker>
        <span data-selected-effect-copy>选择姿势</span><span>›</span>
      </button>
      <div class="pose-custom-settings" data-pose-custom-settings hidden>
        <div class="workspace-inline-fields">
          <label class="workspace-field"><span>人物角度</span><select data-pose-angle><option>正面</option><option>侧面</option><option>背面</option></select></label>
          <label class="workspace-field"><span>镜头</span><select data-pose-camera><option>全身</option><option>中景</option><option>近景</option></select></label>
        </div>
      </div>
    `;
  }
  if (state.toolId === "image-to-video") {
    const support = getVideoParameterSupport();
    const durationOptions = getSchemaOptions(support.duration);
    const ratioOptions = getSchemaOptions(support.aspectRatio);
    const cameraOptions = getSchemaOptions(support.cameraMotion);
    const resolutionOptions = getSchemaOptions(support.resolution);
    const countOptions = getSchemaOptions(support.outputCount);
    return `
      <div class="video-workflow-summary">
        <span>当前视频能力</span>
        <strong>G20 图片转视频</strong>
        <small>仅显示已登记的 Wan2.2Remix 工作流；LTX、WanAnimate 与其他未接入工作流不会作为可用选项展示。</small>
      </div>
      <div class="video-parameter-grid">
        <label class="workspace-field"><span>视频时长</span><select data-video-duration>${durationOptions.map((value) => `<option value="${escapeHtml(value)}" ${String(value) === String(support.duration.schema.default ?? 5) ? "selected" : ""}>${escapeHtml(value)} 秒</option>`).join("")}</select></label>
        <label class="workspace-field"><span>尺寸（长边）</span><select data-video-resolution>${resolutionOptions.map((value) => `<option value="${escapeHtml(value)}" ${String(value) === String(support.resolution.schema.default ?? 1024) ? "selected" : ""}>${escapeHtml(value)} px</option>`).join("")}</select></label>
        ${support.aspectRatio ? `<label class="workspace-field"><span>输出比例</span><select data-video-ratio>${ratioOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select></label>` : ""}
      </div>
      ${support.negativePrompt ? `<label class="workspace-field"><span>负面提示词</span><textarea rows="3" maxlength="1000" data-video-negative-prompt placeholder="描述不希望出现在视频中的内容"></textarea></label>` : `<p class="workspace-capability-note">当前 G20 工作流未公开负面提示词输入，因此页面不会伪造该参数。</p>`}
      <details class="video-advanced-settings">
        <summary>高级参数</summary>
        <div class="video-parameter-grid">
          <label class="workspace-field"><span>Seed</span><input type="text" data-video-seed value="${escapeHtml(support.seed.schema.default ?? "random")}" maxlength="10" inputmode="numeric"><small>输入 0—4294967295 的整数；填写 random 使用随机种子。</small></label>
          <label class="workspace-field"><span>帧率</span><input type="text" value="${escapeHtml(support.fps.schema.default ?? 24)} fps" disabled><small>G20 固定为 24 fps。</small></label>
          ${support.cameraMotion ? `<label class="workspace-field"><span>镜头运动</span><select data-video-camera-motion>${cameraOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select></label>` : ""}
          ${support.motionStrength ? `<label class="workspace-field"><span>运动强度</span><input type="range" data-video-motion-strength min="${Number(support.motionStrength.schema.minimum) || 0}" max="${Number(support.motionStrength.schema.maximum) || 100}" value="${Number(support.motionStrength.schema.default) || 50}"><small data-video-motion-value>${Number(support.motionStrength.schema.default) || 50}</small></label>` : ""}
          ${support.outputCount ? `<label class="workspace-field"><span>输出数量</span><select data-video-output-count>${countOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select></label>` : ""}
        </div>
        <div class="video-toggle-row">
          ${support.faceStability ? `<label><input type="checkbox" data-video-face-stability ${support.faceStability.schema.default === true ? "checked" : ""}> 人脸稳定</label>` : ""}
          ${support.loop ? `<label><input type="checkbox" data-video-loop ${support.loop.schema.default === true ? "checked" : ""}> 循环视频</label>` : ""}
        </div>
      </details>
    `;
  }
  return "";
}

function renderEffectPickerModal() {
  if (!["outfit-studio", "pose-generator"].includes(state.toolId)) return "";
  return `
    <div class="effect-picker-backdrop" data-effect-picker hidden>
      <section class="effect-picker-modal" role="dialog" aria-modal="true" aria-labelledby="effect-picker-title">
        <header>
          <div><span>效果库</span><h2 id="effect-picker-title">${state.toolId === "outfit-studio" ? "选择服装预设" : state.toolId === "pose-generator" ? "选择姿势" : "选择视频效果"}</h2></div>
          <button type="button" data-close-effect-picker aria-label="关闭">×</button>
        </header>
        <div class="effect-picker-toolbar">
          <label><span class="sr-only">搜索</span><input type="search" data-effect-search placeholder="搜索名称"></label>
          <div data-effect-categories></div>
          <div><button type="button" class="is-active" data-effect-sort="热门">热门</button><button type="button" data-effect-sort="最新">最新</button></div>
        </div>
        <div class="effect-picker-grid" data-effect-picker-grid></div>
        <footer>
          <p data-effect-picker-message>没有 active workflow 的预设只能查看，不能提交。</p>
          <button type="button" class="workspace-button primary" data-confirm-effect disabled>确认选择</button>
        </footer>
      </section>
    </div>
  `;
}

function renderShell() {
  if (!root) return;
  const tool = state.tool;
  document.title = `${tool.name} | Luravyn`;
  root.className = "generation-tool-page";
  root.innerHTML = `
    <header class="generation-tool-header">
      <div>
        <a href="./app.html" class="generation-tool-back">← 返回工具首页</a>
        <p class="generation-tool-kicker">${tool.mediaType === "video" ? "AI 视频" : "AI 图片"} · 统一生成工作台</p>
        <h1>${escapeHtml(tool.name)}</h1>
        <p>${escapeHtml(tool.description)}</p>
      </div>
      <span class="generation-tool-availability" data-workflow-availability>正在核对工作流</span>
    </header>
    <div class="generation-tool-grid">
      <section class="generation-input-panel" aria-label="生成参数">
        ${renderImageEditorMode()}
        <section class="workspace-panel asset-uploader" data-uploader data-upload-state="idle">
          <div class="workspace-panel-heading">
            <div>
              <span class="workspace-step">1</span>
              <h2>上传素材</h2>
            </div>
            <span class="upload-state-pill" data-upload-state-label>等待上传</span>
          </div>
          <label class="asset-dropzone" data-asset-dropzone ${state.toolId === "face-swap" ? "hidden" : ""}>
            <input
              type="file"
              data-asset-input
              accept="image/jpeg,image/png,image/webp"
              hidden
            >
            <span class="asset-dropzone-icon">＋</span>
            <strong>点击或拖放图片到这里</strong>
            <small>JPG、PNG、WebP · 单张最大 ${["image-to-video", "image-combiner"].includes(state.toolId) ? "10" : "20"} MB · ${MIN_IMAGE_EDGE}—${["image-to-video", "image-combiner"].includes(state.toolId) ? "4096" : MAX_IMAGE_EDGE}px</small>
            <small>${tool.uploadOptional ? "参考图可选；不上传也可填写描述" : tool.minFiles === tool.maxFiles ? `需要 ${tool.minFiles} 张图片` : `支持 ${tool.minFiles}—${tool.maxFiles} 张图片`}</small>
          </label>
          ${renderFaceSwapUploader()}
          <div class="asset-file-list" data-asset-file-list hidden></div>
          <div class="asset-uploader-actions" data-uploader-actions hidden>
            <button type="button" class="workspace-button secondary" data-replace-assets>替换素材</button>
            <button type="button" class="workspace-button ghost" data-clear-assets>全部删除</button>
          </div>
          <p class="workspace-field-message" data-upload-message>尚未选择文件。</p>
          ${state.toolId === "image-editor" ? `<div class="image-editor-slot-grid" data-editor-slot-grid hidden></div>` : ""}
        </section>

        <section class="workspace-panel generation-parameter-panel">
          <div class="workspace-panel-heading">
            <div><span class="workspace-step">2</span><h2>设置参数</h2></div>
          </div>
          ${renderImageEditorPromptControls()}
          <div data-special-tool-controls>${renderToolModeControls()}</div>
          <label class="workspace-field" data-tool-prompt-field>
            <span>${escapeHtml(tool.promptLabel)}</span>
            <textarea data-generation-prompt rows="5" maxlength="1200" placeholder="${escapeHtml(tool.promptPlaceholder)}"></textarea>
            <small>最多 1200 个字符。请勿输入违法、未成年人或未经同意的真人亲密内容。</small>
          </label>
          ${renderPromptExamples()}
          ${renderImageEditorPromptFooter()}
          ${state.toolId === "image-editor" ? `<div class="image-editor-output-settings" data-editor-output-settings hidden></div>` : ""}
          <fieldset class="workspace-privacy">
            <legend>结果隐私</legend>
            <label><input type="radio" name="generation-privacy" value="private" checked> 私密（默认）</label>
            <label class="is-disabled"><input type="radio" name="generation-privacy" value="public" disabled> 公开（公开作品功能完成后开放）</label>
            <small>上传素材默认私密。文件保存与自动删除周期以隐私政策和服务端配置为准。</small>
          </fieldset>
        </section>

        <section class="workspace-panel generation-credit-summary" data-credit-summary>
          <div class="workspace-panel-heading">
            <div><span class="workspace-step">3</span><h2>积分确认</h2></div>
          </div>
          <dl>
            <div><dt>${state.toolId === "image-to-video" ? "预计积分" : "当前操作消耗"}</dt><dd data-operation-cost>正在读取</dd></div>
            <div><dt>当前积分余额</dt><dd data-workspace-credit-balance>登录后查看</dd></div>
            <div><dt>免费积分</dt><dd data-free-credit>登录后查看</dd></div>
          </dl>
          <a class="workspace-buy-link" href="./pricing.html" data-buy-credits hidden>积分不足，购买积分</a>
        </section>

        <div class="generation-submit-area">
          <button type="button" class="workspace-button primary generation-submit" data-generation-submit disabled>请先上传有效素材</button>
          <p data-submit-reason>完成素材、参数、登录、积分和工作流检查后即可提交。</p>
        </div>
      </section>

      <section class="generation-result-column" aria-label="生成结果与任务">
        <section class="workspace-panel result-workspace" data-result-workspace data-result-state="empty">
          <div class="workspace-panel-heading result-heading">
            <div><span class="workspace-step">结果</span><h2>生成结果</h2></div>
            <span data-result-status>尚未提交</span>
          </div>
          <div data-result-content></div>
        </section>

        <section class="workspace-panel recent-task-panel">
          <div class="workspace-panel-heading">
            <div><span class="workspace-step">历史</span><h2>最近任务</h2></div>
            <a href="./my-creations.html">查看全部</a>
          </div>
          <div class="recent-task-list" data-recent-task-list></div>
        </section>
      </section>
    </div>
    ${renderEffectPickerModal()}
    <div class="workspace-live-region" data-workspace-live aria-live="polite"></div>
  `;
}

function getEditorSlotEntry(key) {
  return state.editorSlots[key] || null;
}

function syncEditorFiles() {
  if (state.toolId !== "image-editor") return;
  if (state.editorMode === "single") {
    state.files = state.editorSlots.main ? [state.editorSlots.main] : [];
    return;
  }
  const supported = getSupportedEditorSlots();
  state.files = supported.map((slot) => state.editorSlots[slot.key]).filter(Boolean);
}

function renderEditorSlots() {
  if (state.toolId !== "image-editor") return;
  const grid = root?.querySelector("[data-editor-slot-grid]");
  const dropzone = root?.querySelector("[data-asset-dropzone]");
  if (!grid || !dropzone) return;
  const slots = getSupportedEditorSlots();
  const multiAvailable = slots.length > 1;
  if (!multiAvailable && state.editorMode === "multi") state.editorMode = "single";
  grid.hidden = state.editorMode !== "multi";
  dropzone.hidden = state.editorMode === "multi";
  if (state.editorMode !== "multi") {
    grid.innerHTML = "";
    return;
  }
  grid.innerHTML = slots.map((slot) => {
    const entry = getEditorSlotEntry(slot.key);
    return `
      <button type="button" class="image-editor-slot ${entry ? "has-file" : ""}" data-editor-slot="${slot.key}">
        ${entry ? `<img src="${escapeHtml(entry.previewUrl)}" alt="${escapeHtml(slot.label)}预览">` : `<span>＋</span>`}
        <strong>${escapeHtml(slot.label)}</strong>
        <small>${entry ? escapeHtml(entry.file.name) : escapeHtml(slot.description)}</small>
      </button>
    `;
  }).join("");
}

function renderEditorOutputs() {
  if (state.toolId !== "image-editor") return;
  const container = root?.querySelector("[data-editor-output-settings]");
  if (!container) return;
  const outputs = getSupportedEditorOutputs();
  container.hidden = !outputs.length;
  if (!outputs.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <fieldset>
      <legend>输出设置</legend>
      <div class="workspace-inline-fields">
        ${outputs.map((output) => {
          if (output.type === "checkbox") {
            return `<label class="workspace-switch"><input type="checkbox" data-editor-output="${output.id}" checked> <span>${escapeHtml(output.label)}</span></label>`;
          }
          if (output.type === "range") {
            return `<label class="workspace-field"><span>${escapeHtml(output.label)}</span><input type="range" min="0" max="100" value="50" data-editor-output="${output.id}"><small data-editor-range-value>50</small></label>`;
          }
          return `<label class="workspace-field"><span>${escapeHtml(output.label)}</span><select data-editor-output="${output.id}">${output.options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>`;
        }).join("")}
      </div>
    </fieldset>
  `;
}

function refreshImageEditorUi() {
  if (state.toolId !== "image-editor") return;
  const tabs = [...root.querySelectorAll("[data-editor-mode]")];
  const slots = getSupportedEditorSlots();
  const multiAvailable = slots.length > 1;
  tabs.forEach((tab) => {
    const mode = tab.dataset.editorMode;
    tab.classList.toggle("is-active", mode === state.editorMode);
    tab.setAttribute("aria-selected", String(mode === state.editorMode));
    if (mode === "multi") {
      tab.disabled = !multiAvailable;
      tab.title = multiAvailable ? "" : "当前生产工作流只公开一张主图片输入";
    }
  });
  const message = root.querySelector("[data-editor-mode-message]");
  if (message) {
    message.textContent = multiAvailable
      ? `当前工作流支持：${slots.map((slot) => slot.label).join("、")}。`
      : "当前生产工作流只支持一张主图片；参考脸、参考服装和参考场景槽位未开放。";
  }
  renderEditorSlots();
  renderEditorOutputs();
}

function isEffectSelectable(effect) {
  if (effect?.status !== "active" || !effect.workflow_id) return false;
  if (state.toolId !== "image-to-video") return true;
  if (state.qaActivePresets) return true;
  return String(state.workflow?.status || "").toLowerCase() === "active"
    && String(state.workflow?.workflow_id || "") === String(effect.workflow_id);
}

function renderEffectPicker() {
  const modal = root?.querySelector("[data-effect-picker]");
  if (!modal) return;
  modal.hidden = !state.effectPickerOpen;
  const presets = getToolPresets();
  const categories = ["全部", ...new Set(presets.map((item) => item.category).filter(Boolean))];
  const categoryNode = modal.querySelector("[data-effect-categories]");
  if (categoryNode) {
    categoryNode.innerHTML = categories.map((category) => `
      <button type="button" class="${state.effectPickerCategory === category ? "is-active" : ""}" data-effect-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    `).join("");
  }
  const query = state.effectPickerQuery.trim().toLowerCase();
  const filtered = presets
    .filter((item) => state.effectPickerCategory === "全部" || item.category === state.effectPickerCategory)
    .filter((item) => !query || `${item.name} ${item.category} ${item.people || ""} ${item.orientation || ""}`.toLowerCase().includes(query))
    .sort((a, b) => state.effectPickerSort === "最新"
      ? String(b.created_at).localeCompare(String(a.created_at))
      : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  const grid = modal.querySelector("[data-effect-picker-grid]");
  if (grid) {
    grid.innerHTML = filtered.length
      ? filtered.map((item) => `
        <button type="button" class="effect-picker-card ${state.selectedEffect === item.effect_id ? "is-selected" : ""}" data-effect-id="${escapeHtml(item.effect_id)}">
          <span class="effect-picker-media">
            ${item.preview_video_url
              ? `<video src="${escapeHtml(item.preview_video_url)}" ${item.poster ? `poster="${escapeHtml(item.poster)}"` : ""} muted playsinline loop preload="metadata" aria-label="${escapeHtml(item.name)}视频预览"></video>`
              : (item.poster || item.preview)
                ? `<img src="${escapeHtml(item.poster || item.preview)}" alt="${escapeHtml(item.name)}预览" loading="lazy">`
              : `<span class="effect-picker-fallback"><b>◇</b><small>预览准备中</small></span>`}
            <em>${isEffectSelectable(item) ? "可用" : "即将上线"}</em>
          </span>
          <span class="effect-picker-card-copy">
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.category)}${item.people ? ` · ${escapeHtml(item.people)}` : ""}${item.orientation ? ` · ${escapeHtml(item.orientation)}` : ""}</small>
            <small>${item.durations?.length ? `${item.durations.join(" / ")} 秒 · ` : ""}${item.credit_cost ? `${item.credit_cost} 积分` : "价格待配置"}${item.estimated_time ? ` · ${escapeHtml(item.estimated_time)}` : ""}</small>
          </span>
        </button>
      `).join("")
      : `<div class="effect-picker-empty"><strong>没有匹配的预设</strong><p>请更换搜索词或分类。</p></div>`;
  }
  const confirm = modal.querySelector("[data-confirm-effect]");
  const selected = getSelectedEffect();
  if (confirm) confirm.disabled = !isEffectSelectable(selected);
  const message = modal.querySelector("[data-effect-picker-message]");
  if (message) {
    message.textContent = selected
      ? isEffectSelectable(selected)
        ? `已选择“${selected.name}”，确认后会使用已登记工作流。`
        : `“${selected.name}”没有 active workflow，当前只能查看。`
      : "没有 active workflow 的预设只能查看，不能提交。";
  }
}

function refreshSpecialToolUi() {
  const controls = root?.querySelector("[data-special-tool-controls]");
  if (controls && state.toolId !== "image-editor") {
    controls.innerHTML = renderToolModeControls();
  }
  if (state.toolId === "face-swap") {
    renderFaceSwapSlots();
    return;
  }
  if (state.toolId === "outfit-studio") {
    root?.querySelectorAll("[data-outfit-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.outfitMode === state.outfitMode);
    });
    const summary = root?.querySelector("[data-open-effect-picker]");
    if (summary) summary.hidden = state.outfitMode !== "preset";
    const reference = root?.querySelector("[data-reference-outfit-panel]");
    if (reference) reference.hidden = state.outfitMode !== "reference";
    const promptField = root?.querySelector("[data-tool-prompt-field]");
    if (promptField) promptField.hidden = state.outfitMode === "preset";
  }
  if (state.toolId === "pose-generator") {
    root?.querySelectorAll("[data-pose-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.poseMode === state.poseMode);
    });
    const summary = root?.querySelector("[data-open-effect-picker]");
    if (summary) summary.hidden = state.poseMode !== "simple";
    const custom = root?.querySelector("[data-pose-custom-settings]");
    if (custom) custom.hidden = state.poseMode !== "custom";
    const promptField = root?.querySelector("[data-tool-prompt-field]");
    if (promptField) promptField.hidden = state.poseMode !== "custom";
  }
  if (state.toolId === "image-to-video") {
    const promptField = root?.querySelector("[data-tool-prompt-field]");
    if (promptField) promptField.hidden = false;
  }
  const selected = getSelectedEffect();
  const copy = root?.querySelector("[data-selected-effect-copy]");
  if (copy) copy.textContent = selected
    ? `${selected.name} · ${isEffectSelectable(selected) ? `${selected.credit_cost || "—"} 积分` : "即将上线"}`
    : state.toolId === "outfit-studio" ? "选择服装预设" : state.toolId === "pose-generator" ? "选择姿势" : "选择视频效果";
  renderEffectPicker();
}

function resetEditorFiles(message = "尚未选择文件。") {
  revokeFileUrls();
  state.files = [];
  state.editorSlots = { main: null, face: null, outfit: null, scene: null };
  const input = root?.querySelector("[data-asset-input]");
  if (input) input.value = "";
  renderFileList();
  renderEditorSlots();
  setUploaderState("idle", message);
}

function updatePromptCount() {
  const prompt = root?.querySelector("[data-generation-prompt]");
  const count = root?.querySelector("[data-prompt-count]");
  if (prompt && count) count.textContent = `${prompt.value.length} / ${prompt.maxLength || 1200}`;
}

function refreshPromptHistorySelect() {
  const select = root?.querySelector("[data-prompt-history]");
  if (!select) return;
  select.innerHTML = `<option value="">选择历史记录</option>${state.promptHistory.map((prompt, index) => `<option value="${index}">${escapeHtml(prompt.slice(0, 44))}</option>`).join("")}`;
}

function restoreEditorTaskInputs(task) {
  if (state.toolId !== "image-editor" || !task?.input_params) return;
  const params = task.input_params;
  const prompt = root?.querySelector("[data-generation-prompt]");
  if (prompt && !prompt.value && params.prompt) prompt.value = String(params.prompt).slice(0, 1200);
  const operation = IMAGE_EDITOR_OPERATIONS.find((item) => item.id === params.operation);
  if (operation) state.editorOperation = operation.id;
  root?.querySelectorAll("[data-editor-operation]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.editorOperation === state.editorOperation);
  });
  updatePromptCount();
}

async function optimizeEditorPrompt() {
  if (state.toolId !== "image-editor") return;
  const prompt = root?.querySelector("[data-generation-prompt]");
  const button = root?.querySelector("[data-optimize-prompt]");
  const live = root?.querySelector("[data-workspace-live]");
  const value = prompt?.value.trim() || "";
  if (!value) {
    if (live) live.textContent = "请先填写需要优化的编辑描述。";
    return;
  }
  if (!state.session || !isSupabaseConfigured) {
    if (live) live.textContent = "登录后可以使用可选的描述优化服务。";
    return;
  }
  if (button) {
    button.disabled = true;
    button.textContent = "正在优化";
  }
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.functions.invoke("ai", {
      body: {
        action: "enhance-prompt",
        prompt: value,
        context: { tool: "image-editor", operation: state.editorOperation, language: "zh-CN" },
      },
    });
    if (error || !data?.enhancedPrompt) throw error || new Error("未返回优化结果");
    prompt.value = String(data.enhancedPrompt).slice(0, 1200);
    updatePromptCount();
    updateSubmitState();
    if (live) live.textContent = "描述已优化，你仍可以继续修改。";
  } catch {
    if (live) live.textContent = "描述优化暂时不可用，原描述已保留。";
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "优化描述";
    }
  }
}

function setUploaderState(status, message = "") {
  state.uploaderStatus = status;
  state.uploaderMessage = message;
  const uploader = root?.querySelector("[data-uploader]");
  const label = root?.querySelector("[data-upload-state-label]");
  const messageNode = root?.querySelector("[data-upload-message]");
  const copy = {
    idle: "等待上传",
    uploading: "读取中",
    uploaded: "已上传",
    validating: "校验中",
    invalid: "需要修改",
    ready: "可以使用",
    failed: "上传失败",
  };
  if (uploader) uploader.dataset.uploadState = status;
  if (label) label.textContent = copy[status] || status;
  if (messageNode) messageNode.textContent = message || "";
  updateSubmitState();
}

function revokeFileUrls() {
  state.files.forEach((entry) => {
    if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
  });
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({
      file,
      previewUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
      format: file.type.replace("image/", "").toUpperCase(),
      size: file.size,
      valid: true,
      error: "",
    });
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error(`${file.name} 无法解码为有效图片。`));
    };
    image.src = previewUrl;
  });
}

async function detectFaces(entry) {
  if (!state.tool.requireFace) return { supported: true, found: true };
  if (!("FaceDetector" in window)) return { supported: false, found: null };
  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 8 });
    const image = new Image();
    image.src = entry.previewUrl;
    await image.decode();
    const faces = await detector.detect(image);
    return { supported: true, found: faces.length > 0, count: faces.length };
  } catch {
    return { supported: false, found: null, count: null };
  }
}

function syncFaceSwapFiles() {
  state.files = FACE_SWAP_SLOT_DEFINITIONS
    .map((slot) => state.faceSwapSlots[slot.key])
    .filter(Boolean);
}

function renderFaceSwapSlots() {
  if (state.toolId !== "face-swap") return;
  FACE_SWAP_SLOT_DEFINITIONS.forEach((slot) => {
    const button = root?.querySelector(`[data-face-slot="${slot.key}"]`);
    const preview = root?.querySelector(`[data-face-preview="${slot.key}"]`);
    const entry = state.faceSwapSlots[slot.key];
    if (!button || !preview) return;
    button.classList.toggle("has-file", Boolean(entry));
    button.classList.toggle("is-active", state.faceActiveSlot === slot.key);
    preview.innerHTML = entry
      ? `<img src="${escapeHtml(entry.previewUrl)}" alt="${slot.label}预览">`
      : "＋";
    const description = button.querySelector("small");
    if (description) description.textContent = entry
      ? `${entry.file.name} · ${entry.width}×${entry.height}`
      : slot.description;
  });
  const picker = root?.querySelector("[data-face-target-picker]");
  const options = root?.querySelector("[data-face-target-options]");
  const count = Number(state.faceTargetCount || 0);
  if (picker) picker.hidden = count <= 1;
  if (options) {
    options.innerHTML = count > 1
      ? Array.from({ length: count }, (_, index) => `
        <button type="button" class="${state.faceTargetIndex === index ? "is-active" : ""}" data-face-target-index="${index}">
          人物 ${index + 1}
        </button>
      `).join("")
      : "";
  }
}

async function handleFaceSwapFile(fileList) {
  const file = [...(fileList || [])][0];
  if (!file) return;
  const slotKey = state.faceActiveSlot;
  const slotLabel = FACE_SWAP_SLOT_DEFINITIONS.find((slot) => slot.key === slotKey)?.label || "图片";
  setUploaderState("uploading", `正在读取${slotLabel}，此步骤不会上传到服务器。`);
  if (!SUPPORTED_TYPES.has(file.type)) {
    setUploaderState("invalid", `${slotLabel}格式不支持，请使用 JPG、PNG 或 WebP。`);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setUploaderState("invalid", `${slotLabel}超过 20 MB。`);
    return;
  }
  try {
    const entry = await readImage(file);
    if (
      entry.width < MIN_IMAGE_EDGE ||
      entry.height < MIN_IMAGE_EDGE ||
      entry.width > MAX_IMAGE_EDGE ||
      entry.height > MAX_IMAGE_EDGE
    ) {
      URL.revokeObjectURL(entry.previewUrl);
      setUploaderState("invalid", `${slotLabel}尺寸需在 ${MIN_IMAGE_EDGE}—${MAX_IMAGE_EDGE}px 之间。`);
      return;
    }
    setUploaderState("validating", `正在检查${slotLabel}中的人脸。`);
    const faceCheck = await detectFaces(entry);
    if (faceCheck.supported && !faceCheck.found) {
      URL.revokeObjectURL(entry.previewUrl);
      setUploaderState("invalid", `${slotLabel}未检测到清晰人脸，请更换图片。`);
      return;
    }
    const previous = state.faceSwapSlots[slotKey];
    if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
    entry.slotKey = slotKey;
    entry.slotLabel = slotLabel;
    entry.faceValidation = faceCheck.supported ? "local" : "server_required";
    state.faceSwapSlots[slotKey] = entry;
    if (slotKey === "target") {
      state.faceTargetCount = faceCheck.count ?? null;
      state.faceTargetIndex = 0;
    }
    syncFaceSwapFiles();
    renderFaceSwapSlots();
    renderFileList();
    const ready = Boolean(state.faceSwapSlots.source && state.faceSwapSlots.target);
    const validationCopy = faceCheck.supported
      ? `${slotLabel}已检测到${faceCheck.count || 1}张人脸。`
      : `${slotLabel}已通过格式与尺寸检查；浏览器不支持本地人脸检测，提交后仍需服务端校验。`;
    setUploaderState(ready ? "ready" : "uploaded", `${validationCopy}${ready ? " 两个素材角色已明确。" : " 请继续上传另一个角色素材。"}`);
  } catch (error) {
    setUploaderState("failed", error?.message || `${slotLabel}读取失败，请重新选择。`);
  }
}

async function handleImageEditorFiles(fileList) {
  const incoming = [...(fileList || [])];
  if (!incoming.length) return;
  const file = incoming[0];
  setUploaderState("uploading", "正在读取本地文件，不会在此步骤上传到服务器。");
  if (!SUPPORTED_TYPES.has(file.type)) {
    setUploaderState("invalid", `${file.name} 格式不支持，请使用 JPG、PNG 或 WebP。`);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setUploaderState("invalid", `${file.name} 超过 20 MB。`);
    return;
  }
  try {
    const entry = await readImage(file);
    if (
      entry.width < MIN_IMAGE_EDGE ||
      entry.height < MIN_IMAGE_EDGE ||
      entry.width > MAX_IMAGE_EDGE ||
      entry.height > MAX_IMAGE_EDGE
    ) {
      URL.revokeObjectURL(entry.previewUrl);
      setUploaderState("invalid", `${file.name} 的尺寸需在 ${MIN_IMAGE_EDGE}—${MAX_IMAGE_EDGE}px 之间。`);
      return;
    }
    const slotKey = state.editorMode === "multi" ? state.editorActiveSlot : "main";
    const previous = state.editorSlots[slotKey];
    if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
    entry.slotKey = slotKey;
    entry.slotLabel = IMAGE_EDITOR_SLOT_DEFINITIONS.find((slot) => slot.key === slotKey)?.label || "主图片";
    state.editorSlots[slotKey] = entry;
    syncEditorFiles();
    renderFileList();
    renderEditorSlots();
    const supported = getSupportedEditorSlots();
    const hasMain = Boolean(state.editorSlots.main);
    const hasReference = supported.some((slot) => slot.key !== "main" && state.editorSlots[slot.key]);
    const ready = state.editorMode === "single" ? hasMain : hasMain && hasReference;
    setUploaderState(
      ready ? "ready" : "uploaded",
      ready
        ? "素材已通过本地格式、大小和分辨率校验。"
        : state.editorMode === "multi"
          ? "请至少上传主图片和一个已开放的参考槽位。"
          : "主图片已读取。"
    );
  } catch (error) {
    setUploaderState("failed", error?.message || "文件读取失败，请重新选择。");
  }
}

async function handleReferenceOutfitFile(fileList) {
  const file = [...(fileList || [])][0];
  if (!file) return;
  if (!schemaSupportsAny(["reference_outfit", "referenceOutfit", "outfit_image"])) {
    setUploaderState("invalid", "当前工作流未公开参考服装输入。");
    return;
  }
  if (!SUPPORTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    setUploaderState("invalid", "参考服装需为 20 MB 以内的 JPG、PNG 或 WebP。");
    return;
  }
  try {
    const entry = await readImage(file);
    if (
      entry.width < MIN_IMAGE_EDGE ||
      entry.height < MIN_IMAGE_EDGE ||
      entry.width > MAX_IMAGE_EDGE ||
      entry.height > MAX_IMAGE_EDGE
    ) {
      URL.revokeObjectURL(entry.previewUrl);
      setUploaderState("invalid", `参考服装尺寸需在 ${MIN_IMAGE_EDGE}—${MAX_IMAGE_EDGE}px 之间。`);
      return;
    }
    if (state.referenceOutfit?.previewUrl) URL.revokeObjectURL(state.referenceOutfit.previewUrl);
    state.referenceOutfit = { ...entry, slotKey: "referenceOutfit", slotLabel: "参考服装" };
    const panel = root?.querySelector("[data-reference-outfit-panel]");
    if (panel) {
      panel.querySelector("p").textContent = `${file.name} · ${entry.width}×${entry.height} · ${formatBytes(entry.size)}`;
    }
    setUploaderState(state.files.length ? "ready" : "uploaded", state.files.length ? "人物图和参考服装已准备完成。" : "参考服装已读取，请继续上传人物图。");
  } catch (error) {
    setUploaderState("failed", error?.message || "参考服装读取失败。");
  } finally {
    state.uploadPurpose = "primary";
  }
}

async function handleFiles(fileList) {
  if (state.toolId === "outfit-studio" && state.uploadPurpose === "referenceOutfit") {
    await handleReferenceOutfitFile(fileList);
    return;
  }
  if (state.toolId === "face-swap") {
    await handleFaceSwapFile(fileList);
    return;
  }
  if (state.toolId === "image-editor") {
    await handleImageEditorFiles(fileList);
    return;
  }
  const incoming = [...(fileList || [])];
  if (!incoming.length) return;
  setUploaderState("uploading", "正在读取本地文件，不会在此步骤上传到服务器。");
  revokeFileUrls();
  state.files = [];
  renderFileList();

  if (incoming.length < state.tool.minFiles || incoming.length > state.tool.maxFiles) {
    setUploaderState("invalid", `请选择 ${state.tool.minFiles === state.tool.maxFiles ? state.tool.minFiles : `${state.tool.minFiles}—${state.tool.maxFiles}`} 张图片。`);
    return;
  }
  const invalidType = incoming.find((file) => !SUPPORTED_TYPES.has(file.type));
  if (invalidType) {
    setUploaderState("invalid", `${invalidType.name} 格式不支持，请使用 JPG、PNG 或 WebP。`);
    return;
  }
  const maxFileSize = ["image-to-video", "image-combiner"].includes(state.toolId) ? VIDEO_MAX_FILE_SIZE : MAX_FILE_SIZE;
  const oversized = incoming.find((file) => file.size > maxFileSize);
  if (oversized) {
    setUploaderState("invalid", `${oversized.name} 超过 ${["image-to-video", "image-combiner"].includes(state.toolId) ? "10" : "20"} MB。`);
    return;
  }

  try {
    state.files = await Promise.all(incoming.map(readImage));
    setUploaderState("uploaded", "文件读取完成。");
    renderFileList();
    setUploaderState("validating", "正在校验尺寸和素材要求。");

    const badDimensions = state.files.find((entry) =>
      entry.width < MIN_IMAGE_EDGE ||
      entry.height < MIN_IMAGE_EDGE ||
      entry.width > (["image-to-video", "image-combiner"].includes(state.toolId) ? 4096 : MAX_IMAGE_EDGE) ||
      entry.height > (["image-to-video", "image-combiner"].includes(state.toolId) ? 4096 : MAX_IMAGE_EDGE)
    );
    if (badDimensions) {
      badDimensions.valid = false;
      badDimensions.error = `尺寸需在 ${MIN_IMAGE_EDGE}—${MAX_IMAGE_EDGE}px 之间。`;
      renderFileList();
      setUploaderState("invalid", `${badDimensions.file.name} 的尺寸不符合要求。`);
      return;
    }

    if (state.tool.requireFace) {
      const faceChecks = await Promise.all(state.files.map(detectFaces));
      const noFaceIndex = faceChecks.findIndex((check) => check.supported && !check.found);
      if (noFaceIndex >= 0) {
        state.files[noFaceIndex].valid = false;
        state.files[noFaceIndex].error = "未检测到清晰人脸。";
        renderFileList();
        setUploaderState("invalid", `${state.files[noFaceIndex].file.name} 未检测到清晰人脸。`);
        return;
      }
      if (faceChecks.some((check) => !check.supported)) {
        setUploaderState("ready", "浏览器不支持本地人脸检测；提交后仍需通过服务端人脸与内容校验。");
        return;
      }
    }

    setUploaderState("ready", "素材已通过本地格式、大小和分辨率校验。");
  } catch (error) {
    revokeFileUrls();
    state.files = [];
    renderFileList();
    setUploaderState("failed", error?.message || "文件读取失败，请重新选择。");
  }
}

function renderFileList() {
  const list = root?.querySelector("[data-asset-file-list]");
  const actions = root?.querySelector("[data-uploader-actions]");
  if (!list || !actions) return;
  if (!state.files.length) {
    list.hidden = true;
    actions.hidden = true;
    list.innerHTML = "";
    return;
  }
  list.hidden = false;
  actions.hidden = false;
  list.innerHTML = state.files.map((entry, index) => `
    <article class="asset-file-card ${entry.valid ? "" : "is-invalid"}">
      <img src="${escapeHtml(entry.previewUrl)}" alt="${escapeHtml(entry.file.name)} 的本地预览">
      <div>
        <strong>${entry.slotLabel ? `${escapeHtml(entry.slotLabel)} · ` : ""}${escapeHtml(entry.file.name)}</strong>
        <span>${entry.width} × ${entry.height} · ${entry.format} · ${formatBytes(entry.size)}</span>
        ${entry.error ? `<small>${escapeHtml(entry.error)}</small>` : ""}
      </div>
      <button type="button" data-remove-asset="${index}" aria-label="删除 ${escapeHtml(entry.file.name)}">删除</button>
    </article>
  `).join("");
}

function renderEmptyResult() {
  const content = root?.querySelector("[data-result-content]");
  const status = root?.querySelector("[data-result-status]");
  const workspace = root?.querySelector("[data-result-workspace]");
  if (!content || !status || !workspace) return;
  workspace.dataset.resultState = "empty";
  status.textContent = "尚未提交";
  content.innerHTML = `
    <div class="result-empty-guidance">
      <span>□</span>
      <strong>从左侧开始创建</strong>
      <p>上传有效素材、填写参数并确认积分后，排队和生成状态会显示在这里。</p>
      <ol>
        <li>准备符合要求的图片</li>
        <li>确认效果描述与隐私设置</li>
        <li>提交后可离开页面，刷新会恢复真实任务状态</li>
      </ol>
    </div>
  `;
}

function renderProgress(task) {
  const raw = Number(task.progress);
  const hasProgress = Number.isFinite(raw) && raw > 0;
  const progress = Math.min(100, Math.max(0, raw || 0));
  return `
    <div class="task-progress ${hasProgress ? "" : "is-indeterminate"}" aria-label="${hasProgress ? `进度 ${progress}%` : "服务端处理中"}">
      <span style="${hasProgress ? `width:${progress}%` : ""}"></span>
    </div>
    ${hasProgress ? `<strong>${progress}%</strong>` : `<strong>等待服务端返回进度</strong>`}
  `;
}

function getRefundCopy(task) {
  const transaction = state.refunds.get(String(task.id));
  const rawStatus = String(task?.status || "").toLowerCase();
  if (!transaction && ["timed_out", "timeout"].includes(rawStatus)) {
    return "退款状态待核对；未自动完成时请转人工处理";
  }
  if (!transaction) return "退款状态请在积分记录中核对";
  const amount = Math.abs(Number(transaction.balance_impact ?? transaction.amount ?? 0));
  return amount > 0 ? `已退回 ${amount} 积分` : "退款记录已建立";
}

function getVideoResultMetadata(task) {
  if (state.toolId !== "image-to-video") return null;
  const params = task?.input_params || {};
  const assets = Array.isArray(task?.output_assets) ? task.output_assets : [];
  const output = assets.find((asset) => asset && typeof asset === "object") || {};
  const metadata = output.metadata || output.metadata_json || {};
  const effectId = params.videoEffectId || params.effectId || "";
  const effect = getToolPresets().find((item) => item.effect_id === effectId);
  const duration = Number(task?.duration_seconds || params.durationSeconds || metadata.duration_seconds || metadata.duration || 0);
  const fileSize = Number(output.file_size || output.size || metadata.file_size || metadata.size || 0);
  return {
    duration: duration > 0 ? `${duration} 秒` : "",
    resolution: String(task?.resolution || params.resolution || metadata.resolution || ""),
    fileSize: fileSize > 0 ? formatBytes(fileSize) : "",
    createdAt: formatDate(task?.created_at),
    effect: effect?.name || String(params.videoEffectName || effectId || ""),
  };
}

function renderResult(task = state.currentTask || state.localTask) {
  if (!task) {
    renderEmptyResult();
    return;
  }
  const content = root?.querySelector("[data-result-content]");
  const statusNode = root?.querySelector("[data-result-status]");
  const workspace = root?.querySelector("[data-result-workspace]");
  if (!content || !statusNode || !workspace) return;
  const status = normalizeStatus(task.status);
  workspace.dataset.resultState = status;
  statusNode.textContent = getTaskStage(task);
  const taskId = escapeHtml(task.id || "本地状态");

  if (status === "queued") {
    content.innerHTML = `
      <div class="result-task-state">
        <span class="task-state-icon">⌛</span>
        <h3>任务正在排队</h3>
        <p>任务编号：${taskId}</p>
        <dl><div><dt>创建时间</dt><dd>${formatDate(task.created_at)}</dd></div><div><dt>积分</dt><dd>${Number(task.cost_credits || 0) || "以账单为准"}</dd></div></dl>
        ${task.id && !String(task.id).startsWith("qa-") ? `<button type="button" class="workspace-button secondary" data-cancel-task="${taskId}">取消排队任务</button>` : ""}
      </div>
    `;
    return;
  }
  if (status === "processing") {
    const stage = getTaskStage(task);
    content.innerHTML = `
      <div class="result-task-state">
        <span class="task-state-icon">◌</span>
        <h3>正在生成</h3>
        <p>${escapeHtml(stage)}</p>
        ${renderProgress(task)}
        <dl><div><dt>开始时间</dt><dd>${formatDate(task.created_at)}</dd></div><div><dt>任务编号</dt><dd>${taskId}</dd></div></dl>
      </div>
    `;
    return;
  }
  if (status === "completed") {
    const resultUrl = getTaskResultUrl(task);
    const isVideo = String(task.media_type || state.tool.mediaType) === "video";
    const sourcePreviewUrl = state.files[0]?.previewUrl || "";
    const videoMetadata = getVideoResultMetadata(task);
    content.innerHTML = `
      <div class="result-completed">
        ${resultUrl ? (
          isVideo
            ? `<video src="${escapeHtml(resultUrl)}" controls playsinline preload="metadata"></video>`
            : `<img src="${escapeHtml(resultUrl)}" alt="${escapeHtml(state.tool.outputLabel)}" data-result-preview data-result-url="${escapeHtml(resultUrl)}" ${sourcePreviewUrl ? `data-source-url="${escapeHtml(sourcePreviewUrl)}"` : ""}>`
        ) : `<div class="result-missing-media"><strong>任务已完成</strong><p>服务端未返回可预览的结果地址，请到“我的作品”核对。</p></div>`}
        ${videoMetadata ? `
          <dl class="result-output-metadata">
            ${videoMetadata.duration ? `<div><dt>时长</dt><dd>${escapeHtml(videoMetadata.duration)}</dd></div>` : ""}
            ${videoMetadata.resolution ? `<div><dt>分辨率</dt><dd>${escapeHtml(videoMetadata.resolution)}</dd></div>` : ""}
            ${videoMetadata.fileSize ? `<div><dt>文件大小</dt><dd>${escapeHtml(videoMetadata.fileSize)}</dd></div>` : ""}
            <div><dt>创建时间</dt><dd>${escapeHtml(videoMetadata.createdAt)}</dd></div>
            ${videoMetadata.effect ? `<div><dt>使用效果</dt><dd>${escapeHtml(videoMetadata.effect)}</dd></div>` : ""}
          </dl>
        ` : ""}
        <div class="result-actions">
          ${resultUrl ? `<a class="workspace-button primary" href="${escapeHtml(resultUrl)}" target="_blank" rel="noreferrer" download>下载</a>` : ""}
          ${resultUrl && !isVideo && sourcePreviewUrl ? `<button type="button" class="workspace-button secondary" data-compare-result>对比原图</button>` : ""}
          ${resultUrl ? `<button type="button" class="workspace-button secondary" data-save-result="${taskId}">保存</button>` : ""}
          <button type="button" class="workspace-button secondary" data-regenerate>${state.toolId === "image-editor" ? "再次编辑" : "再次生成"}</button>
          ${isVideo ? `<button type="button" class="workspace-button secondary" data-retry-new-prompt>使用新描述重试</button>` : ""}
          <button type="button" class="workspace-button secondary" ${state.toolId === "image-editor" ? "data-copy-prompt" : "data-copy-params"}>${state.toolId === "image-editor" ? "复制提示词" : "复制参数"}</button>
          ${resultUrl ? `<button type="button" class="workspace-button secondary" data-share-result="${taskId}">分享</button>` : ""}
          ${resultUrl && !isVideo ? `<button type="button" class="workspace-button secondary" data-result-to-video="${taskId}">转视频</button>` : ""}
          <a class="workspace-button secondary" href="./my-creations.html">我的创作</a>
        </div>
      </div>
    `;
    return;
  }
  if (status === "failed" || status === "restricted") {
    const timedOut = ["timed_out", "timeout"].includes(String(task.status || "").toLowerCase());
    content.innerHTML = `
      <div class="result-task-state is-failed">
        <span class="task-state-icon">!</span>
        <h3>${status === "restricted" ? "内容未通过检查" : timedOut ? "任务处理超时" : "生成失败"}</h3>
        <p>${escapeHtml(timedOut ? "任务处理时间已超过服务端限制，请核对积分退款状态后重试；未自动处理时请联系支持。" : getFriendlyGenerationError(task.error_message || task.error || "服务端未提供具体失败原因，请修改输入后重试。"))}</p>
        <strong>${escapeHtml(getRefundCopy(task))}</strong>
        <div class="result-actions">
          <button type="button" class="workspace-button secondary" data-focus-input>修改输入</button>
          <button type="button" class="workspace-button primary" data-regenerate>重试</button>
        </div>
      </div>
    `;
    return;
  }
  content.innerHTML = `
    <div class="result-task-state">
      <span class="task-state-icon">×</span>
      <h3>任务已取消</h3>
      <p>没有继续生成。已扣积分的退款状态请在积分记录中核对。</p>
      <button type="button" class="workspace-button secondary" data-regenerate>重新设置</button>
    </div>
  `;
}

function renderHistory() {
  const list = root?.querySelector("[data-recent-task-list]");
  if (!list) return;
  if (!state.session) {
    list.innerHTML = `
      <div class="task-history-empty">
        <strong>登录后查看任务记录</strong>
        <p>登录后可恢复排队、生成中、成功和失败任务。</p>
        <button type="button" class="workspace-button secondary" data-login-required>登录</button>
      </div>
    `;
    return;
  }
  if (!state.jobs.length) {
    list.innerHTML = `
      <div class="task-history-empty">
        <strong>还没有任务记录</strong>
        <p>先上传素材并完成左侧检查。提交后，这里会显示缩略图、状态、时间和积分。</p>
        <button type="button" class="workspace-button secondary" data-focus-input>开始准备素材</button>
      </div>
    `;
    return;
  }
  list.innerHTML = state.jobs.slice(0, 6).map((task) => {
    const status = normalizeStatus(task.status);
    const url = getTaskResultUrl(task);
    return `
      <article class="recent-task-card" data-task-id="${escapeHtml(task.id)}">
        <div class="recent-task-thumb">
          ${url && String(task.media_type) !== "video" ? `<img src="${escapeHtml(url)}" alt="">` : `<span>${String(task.media_type) === "video" ? "▶" : "□"}</span>`}
        </div>
        <div>
          <strong>${escapeHtml(state.tool.name)}</strong>
          <span>${STATUS_COPY[status] || status} · ${formatDate(task.created_at)}</span>
          <small>${Number(task.cost_credits || 0) || "账单待核对"} 积分</small>
        </div>
        <button type="button" data-view-task="${escapeHtml(task.id)}">查看</button>
      </article>
    `;
  }).join("");
}

function renderAccountSummary() {
  const costNode = root?.querySelector("[data-operation-cost]");
  const balanceNode = root?.querySelector("[data-workspace-credit-balance]");
  const freeNode = root?.querySelector("[data-free-credit]");
  const buyLink = root?.querySelector("[data-buy-credits]");
  const cost = getConfiguredCost();
  if (costNode) costNode.textContent = cost ? `${cost} 积分` : "价格配置中";
  if (!state.session) {
    if (balanceNode) balanceNode.textContent = "登录后查看";
    if (freeNode) freeNode.textContent = "登录后查看";
    if (buyLink) buyLink.hidden = true;
    return;
  }
  if (balanceNode) balanceNode.textContent = Number.isFinite(state.balance) ? `${state.balance} 积分` : "读取失败";
  const freeCredits = Number(state.catalogTool?.free_credits || 0);
  if (freeNode) freeNode.textContent = freeCredits > 0 ? `本工具可用 ${freeCredits} 免费积分` : "当前无可用免费积分";
  if (buyLink) buyLink.hidden = !(cost && Number.isFinite(state.balance) && state.balance < cost);
}

function getSubmitBlocker() {
  if (!hasConfiguredWorkflow()) return "即将上线：工作流尚未完成真实验证";
  if (state.toolId === "face-swap") {
    if (!schemaSupportsAny(["source_face", "sourceFace", "face_image"]) || !schemaSupportsAny(["target_image", "targetImage"])) {
      return "当前工作流尚未公开源人脸与目标图片两个独立输入";
    }
    if (!state.faceSwapSlots.source) return "请先上传源人脸";
    if (!state.faceSwapSlots.target) return "请再上传目标图片";
    if (state.uploaderStatus !== "ready") return "两张素材必须分别通过校验";
  } else if (state.toolId === "image-editor") {
    const supported = getSupportedEditorSlots();
    const hasMain = Boolean(state.editorSlots.main);
    const hasReference = supported.some((slot) => slot.key !== "main" && state.editorSlots[slot.key]);
    if (state.uploaderStatus !== "ready" || !hasMain) return "请先上传并通过素材校验";
    if (state.editorMode === "multi" && !hasReference) return "多图模式至少需要主图片和一个参考图片";
  } else if (state.toolId === "image-generate") {
    if (state.files.length > state.tool.maxFiles) return "参考图最多只能上传 1 张";
    if (state.files.length && state.uploaderStatus !== "ready") return "参考图尚未通过素材校验";
  } else if (
    state.uploaderStatus !== "ready" ||
    state.files.length < state.tool.minFiles ||
    state.files.length > state.tool.maxFiles
  ) return "请先上传并通过素材校验";
  const prompt = root?.querySelector("[data-generation-prompt]")?.value.trim() || "";
  if (state.toolId === "image-to-video") {
    const effect = getSelectedEffect();
    if (!effect) return "图片转视频工作流尚未登记";
    if (!isEffectSelectable(effect)) return "所选视频效果尚无 active workflow";
    const seed = root?.querySelector("[data-video-seed]")?.value?.trim() || "random";
    if (seed !== "random" && (!/^\d+$/.test(seed) || Number(seed) > 4294967295)) {
      return "Seed 必须为 random 或 0—4294967295 的整数";
    }
  } else if (state.toolId === "outfit-studio" && state.outfitMode === "preset") {
    if (!schemaSupportsAny(["effect", "effect_id", "outfit_preset"])) return "当前工作流尚未公开服装预设输入";
    const effect = getSelectedEffect();
    if (!effect) return "请先选择服装预设";
    if (!isEffectSelectable(effect)) return "所选服装预设尚无可用工作流";
  } else if (state.toolId === "outfit-studio" && state.outfitMode === "reference") {
    if (!schemaSupportsAny(["reference_outfit", "referenceOutfit", "outfit_image"])) return "当前工作流未公开参考服装输入";
    if (!state.referenceOutfit) return "请上传参考服装图片";
  } else if (state.toolId === "pose-generator" && state.poseMode === "simple") {
    if (!schemaSupportsAny(["effect", "effect_id", "pose_preset"])) return "当前工作流尚未公开姿势预设输入";
    const effect = getSelectedEffect();
    if (!effect) return "请先选择姿势";
    if (!isEffectSelectable(effect)) return "所选姿势尚无可用工作流";
  } else if (!state.tool.promptOptional && prompt.length < 3) {
    return "请填写至少 3 个字符的生成描述";
  }
  if (!state.session) return "登录后才能提交任务";
  const cost = getConfiguredCost();
  if (!cost) return "该工具尚未配置明确积分价格";
  if (!Number.isFinite(state.balance)) return "积分余额读取失败";
  if (state.balance < cost) return "积分不足，请先购买积分";
  if (state.submitLocked) return "任务正在提交，请勿重复创建";
  return "";
}

function updateSubmitState() {
  const button = root?.querySelector("[data-generation-submit]");
  const reason = root?.querySelector("[data-submit-reason]");
  const availability = root?.querySelector("[data-workflow-availability]");
  if (!button || !reason) return;
  const blocker = getSubmitBlocker();
  button.disabled = Boolean(blocker);
  button.textContent = blocker || `创建${state.tool.mediaType === "video" ? "视频" : "图片"}任务`;
  reason.textContent = blocker || "提交后将使用服务端返回的真实排队和生成状态。";
  if (availability) {
    availability.textContent = hasConfiguredWorkflow() ? "工作流可用" : "即将上线";
    availability.classList.toggle("is-active", hasConfiguredWorkflow());
  }
}

async function loadWorkspaceData() {
  state.session = await getSession();
  if (!isSupabaseConfigured) {
    renderAccountSummary();
    renderHistory();
    updateSubmitState();
    return;
  }
  const client = getSupabaseClient();
  try {
    const { data: tool } = await client
      .from("tools")
      .select("id,slug,name,status,credits_cost,free_credits,cost_per_run,workflow_id")
      .eq("slug", state.toolId)
      .in("status", ["published", "active"])
      .maybeSingle();
    state.catalogTool = tool || null;
    if (tool?.id) {
      const { data: workflow } = await client
        .from("workflows")
        .select("id,workflow_id,status,cost,input_schema,output_schema,updated_at")
        .eq("tool_id", tool.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      state.workflow = workflow || null;
    }
  } catch {
    state.catalogTool = null;
    state.workflow = null;
  }

  if (state.session?.user) {
    const userId = state.session.user.id;
    const [creditResponse, jobResponse] = await Promise.all([
      client.from("credits").select("credits,updated_at").eq("user_id", userId).maybeSingle(),
      client
        .from("generation_jobs")
        .select("id,status,progress,result_url,created_at,updated_at,completed_at,tool_slug,tool_type,media_type,cost_credits,credit_charged,error_message,error_code,input_params,output_assets,duration_seconds,aspect_ratio,resolution,latency,result_asset_id")
        .eq("user_id", userId)
        .eq("tool_slug", state.toolId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    state.balance = creditResponse.error ? null : Number(creditResponse.data?.credits);
    state.jobs = jobResponse.error || !Array.isArray(jobResponse.data) ? [] : jobResponse.data;
    const jobIds = state.jobs.map((job) => String(job.id)).filter(Boolean);
    state.refunds = new Map();
    if (jobIds.length) {
      const { data: transactions } = await client
        .from("credit_transactions")
        .select("source_id,related_job_id,balance_impact,amount,status,operation_category")
        .eq("user_id", userId)
        .in("source_id", jobIds);
      (transactions || []).forEach((transaction) => {
        const id = String(transaction.source_id || transaction.related_job_id || "");
        const isRefund =
          Number(transaction.balance_impact ?? transaction.amount ?? 0) > 0 ||
          String(transaction.operation_category || "").includes("refund");
        if (id && isRefund) state.refunds.set(id, transaction);
      });
    }
    const savedId = sessionStorage.getItem(`luravyn:last-task:${state.toolId}`);
    state.currentTask =
      state.jobs.find((job) => String(job.id) === savedId) ||
      state.jobs.find((job) => ACTIVE_TASK_STATUSES.has(String(job.status).toLowerCase())) ||
      state.jobs[0] ||
      null;
    restoreEditorTaskInputs(state.currentTask);
  } else {
    state.balance = null;
    state.jobs = [];
    state.currentTask = null;
  }
  renderAccountSummary();
  renderHistory();
  renderResult();
  refreshImageEditorUi();
  refreshSpecialToolUi();
  updateSubmitState();
  updatePolling();
}

function triggerLogin() {
  const login = document.querySelector("[data-auth-modal]") || document.querySelector('a[href*="login"], a[href*="signin"]');
  if (login) login.click();
}

function createIdempotencyKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `gen-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function collectEditorOutputSettings() {
  if (state.toolId !== "image-editor") return {};
  const settings = {};
  root.querySelectorAll("[data-editor-output]").forEach((control) => {
    settings[control.dataset.editorOutput] = control.type === "checkbox"
      ? control.checked
      : control.type === "range"
        ? Number(control.value)
        : control.value;
  });
  return settings;
}

function collectEditorRoleAssets() {
  if (state.toolId !== "image-editor") return {};
  return Object.fromEntries(
    getSupportedEditorSlots()
      .map((slot) => [slot.key, state.editorSlots[slot.key]?.file || null])
      .filter(([, file]) => Boolean(file))
  );
}

function collectSpecialToolParams() {
  const effect = getSelectedEffect();
  if (state.toolId === "face-swap") {
    const options = {};
    root.querySelectorAll("[data-face-option]").forEach((control) => {
      options[control.dataset.faceOption] = control.type === "checkbox" ? control.checked : Number(control.value);
    });
    return {
      toolMode: "face_swap",
      roleAssets: {
        sourceFace: state.faceSwapSlots.source?.file || null,
        targetImage: state.faceSwapSlots.target?.file || null,
      },
      faceSwap: {
        targetFaceIndex: state.faceTargetIndex,
        targetFaceCount: state.faceTargetCount,
        sourceValidation: state.faceSwapSlots.source?.faceValidation || null,
        targetValidation: state.faceSwapSlots.target?.faceValidation || null,
        ...options,
      },
    };
  }
  if (state.toolId === "outfit-studio") {
    return {
      toolMode: state.outfitMode,
      effectId: effect?.effect_id || null,
      effectPromptTemplate: effect?.prompt_template || null,
      roleAssets: state.referenceOutfit ? { referenceOutfit: state.referenceOutfit.file } : {},
    };
  }
  if (state.toolId === "pose-generator") {
    return {
      toolMode: state.poseMode,
      effectId: effect?.effect_id || null,
      effectPromptTemplate: effect?.prompt_template || null,
      poseAngle: root.querySelector("[data-pose-angle]")?.value || null,
      camera: root.querySelector("[data-pose-camera]")?.value || null,
    };
  }
  if (state.toolId === "image-to-video") {
    return {
      toolMode: "image_to_video",
      effectId: effect?.effect_id || null,
      videoEffectId: effect?.effect_id || null,
      effectPromptTemplate: effect?.prompt_template || null,
      workflowId: effect?.workflow_id || state.workflow?.workflow_id || null,
      cameraMotion: root.querySelector("[data-video-camera-motion]")?.value || null,
      motionStrength: root.querySelector("[data-video-motion-strength]") ? Number(root.querySelector("[data-video-motion-strength]").value) : null,
      faceStability: Boolean(root.querySelector("[data-video-face-stability]")?.checked),
      loop: Boolean(root.querySelector("[data-video-loop]")?.checked),
      resolution: root.querySelector("[data-video-resolution]")?.value || null,
      outputCount: root.querySelector("[data-video-output-count]") ? Number(root.querySelector("[data-video-output-count]").value) : 1,
      seed: root.querySelector("[data-video-seed]")?.value?.trim() || "random",
      negativePrompt: root.querySelector("[data-video-negative-prompt]")?.value?.trim() || null,
      priceQuote: calculateVideoCost(),
    };
  }
  return {};
}

function getFriendlyGenerationError(error) {
  const raw = String(error?.message || error || "").trim();
  if (!raw) return "任务提交失败，请稍后重试。";
  const lower = raw.toLowerCase();
  if (lower.includes("workflow") && (lower.includes("inactive") || lower.includes("not found") || lower.includes("unavailable"))) {
    return "当前效果工作流暂不可用，请更换效果或稍后再试。";
  }
  if (lower.includes("face") && (lower.includes("detect") || lower.includes("not found"))) {
    return "图片中没有检测到可用人脸，请更换清晰、无遮挡的图片。";
  }
  if (lower.includes("credit") || lower.includes("balance")) {
    return "积分不足或积分状态读取失败，请核对余额后重试。";
  }
  if (lower.includes("policy") || lower.includes("safety") || lower.includes("restricted")) {
    return "素材或描述未通过内容检查，请更换合规内容后重试。";
  }
  if (lower.includes("timeout") || lower.includes("network") || lower.includes("fetch")) {
    return "网络或生成服务暂时不可用，请稍后重试。";
  }
  return raw.split(/\r?\n/)[0].slice(0, 220);
}

async function submitGeneration() {
  const blocker = getSubmitBlocker();
  if (blocker) {
    if (!state.session) triggerLogin();
    updateSubmitState();
    return;
  }
  state.submitLocked = true;
  updateSubmitState();
  const idempotencyKey = createIdempotencyKey();
  sessionStorage.setItem(`luravyn:idempotency:${state.toolId}`, idempotencyKey);
  const prompt = root.querySelector("[data-generation-prompt]").value.trim();
  savePromptHistory(prompt);
  refreshPromptHistorySelect();
  const privacy = root.querySelector('input[name="generation-privacy"]:checked')?.value || "private";
  const params = {
    prompt: prompt || getSelectedEffect()?.prompt_template || "",
    operation: state.toolId === "image-editor" ? state.editorOperation : undefined,
    editorMode: state.toolId === "image-editor" ? state.editorMode : undefined,
    roleAssets: collectEditorRoleAssets(),
    outputSettings: collectEditorOutputSettings(),
    file: state.files[0]?.file || null,
    files: state.files.map((entry) => entry.file),
    privacy,
    idempotencyKey,
    aspectRatio: root.querySelector("[data-video-ratio]")?.value || root.querySelector("[data-generation-ratio]")?.value,
    durationSeconds: Number(root.querySelector("[data-video-duration]")?.value || root.querySelector("[data-generation-duration]")?.value || 0) || undefined,
    ...collectSpecialToolParams(),
  };
  const live = root.querySelector("[data-workspace-live]");
  if (live) live.textContent = "任务正在提交。";
  try {
    const service = window.__OVS_API_SERVICE__;
    if (!service?.generate) throw new Error("生成服务尚未加载。");
    const response = await service.generate(state.toolId, params);
    const task = response?.job || response?.task || response;
    if (!task || !(task.id || task.taskId || task.task_id || task.result_url || task.outputUrl)) {
      throw new Error("服务端未返回可恢复的任务编号或结果。");
    }
    const normalized = {
      ...task,
      id: task.id || task.taskId || task.task_id,
      status: task.status || (task.result_url || task.outputUrl ? "completed" : "queued"),
      result_url: task.result_url || task.outputUrl || task.output_url || "",
      media_type: state.tool.mediaType,
      cost_credits: getConfiguredCost(),
      created_at: task.created_at || new Date().toISOString(),
    };
    state.localTask = normalized;
    if (normalized.id) sessionStorage.setItem(`luravyn:last-task:${state.toolId}`, String(normalized.id));
    renderResult(normalized);
    await loadWorkspaceData();
  } catch (error) {
    state.localTask = {
      id: `local-failure-${Date.now()}`,
      status: "failed",
      error_message: getFriendlyGenerationError(error),
      created_at: new Date().toISOString(),
      cost_credits: getConfiguredCost(),
    };
    renderResult(state.localTask);
  } finally {
    state.submitLocked = false;
    updateSubmitState();
    if (live) live.textContent = "";
  }
}

async function cancelTask(taskId) {
  if (!state.session || !taskId || !isSupabaseConfigured) return;
  const cancel = window.__OVS_WORKFLOW_API__?.cancel;
  if (typeof cancel !== "function") {
    state.localTask = {
      id: taskId,
      status: "failed",
      error_message: "取消服务暂不可用，任务不会在前端直接改写。请稍后刷新核对状态。",
      created_at: new Date().toISOString(),
    };
    renderResult(state.localTask);
    return;
  }
  try {
    await cancel(taskId);
    await loadWorkspaceData();
  } catch (error) {
    state.localTask = {
      id: taskId,
      status: "failed",
      error_message: getFriendlyGenerationError(error),
      created_at: new Date().toISOString(),
    };
    renderResult(state.localTask);
  }
}

function buildTaskParams(task) {
  return task?.input_params || {
    tool: state.toolId,
    prompt: root?.querySelector("[data-generation-prompt]")?.value.trim() || "",
    operation: state.toolId === "image-editor" ? state.editorOperation : undefined,
    editorMode: state.toolId === "image-editor" ? state.editorMode : undefined,
    outputSettings: collectEditorOutputSettings(),
    aspectRatio: root?.querySelector("[data-video-ratio]")?.value || null,
    durationSeconds: Number(root?.querySelector("[data-video-duration]")?.value || 0) || null,
    ...collectSpecialToolParams(),
    privacy: root?.querySelector('input[name="generation-privacy"]:checked')?.value || "private",
  };
}

async function handleResultAction(target) {
  if (target.matches("[data-login-required]")) return triggerLogin();
  if (target.matches("[data-focus-input], [data-regenerate]")) {
    root.querySelector("[data-asset-dropzone]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    root.querySelector("[data-generation-prompt]")?.focus();
    return;
  }
  if (target.matches("[data-retry-new-prompt]")) {
    const prompt = root.querySelector("[data-generation-prompt]");
    root.querySelector("[data-tool-prompt-field]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    prompt?.focus();
    prompt?.select();
    return;
  }
  if (target.matches("[data-cancel-task]")) return cancelTask(target.dataset.cancelTask);
  if (target.matches("[data-view-task]")) {
    state.currentTask = state.jobs.find((job) => String(job.id) === target.dataset.viewTask) || null;
    if (state.currentTask) {
      sessionStorage.setItem(`luravyn:last-task:${state.toolId}`, String(state.currentTask.id));
      restoreEditorTaskInputs(state.currentTask);
      renderResult();
      root.querySelector("[data-result-workspace]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
  const task = state.currentTask || state.localTask;
  if (target.matches("[data-copy-prompt]")) {
    const prompt = buildTaskParams(task)?.prompt || root?.querySelector("[data-generation-prompt]")?.value.trim() || "";
    await navigator.clipboard.writeText(String(prompt));
    target.textContent = "已复制";
    return;
  }
  if (target.matches("[data-compare-result]")) {
    const preview = root.querySelector("[data-result-preview]");
    if (!preview?.dataset.sourceUrl || !preview.dataset.resultUrl) return;
    const showingSource = preview.dataset.compareState === "source";
    preview.src = showingSource ? preview.dataset.resultUrl : preview.dataset.sourceUrl;
    preview.dataset.compareState = showingSource ? "result" : "source";
    target.textContent = showingSource ? "对比原图" : "查看结果";
    return;
  }
  if (target.matches("[data-copy-params]")) {
    await navigator.clipboard.writeText(JSON.stringify(buildTaskParams(task), null, 2));
    target.textContent = "已复制";
    return;
  }
  if (target.matches("[data-share-result]")) {
    const url = getTaskResultUrl(task);
    if (!url) return;
    if (navigator.share) await navigator.share({ title: state.tool.name, url });
    else await navigator.clipboard.writeText(url);
    return;
  }
  if (target.matches("[data-save-result]")) {
    const resultUrl = getTaskResultUrl(task);
    if (!resultUrl || !state.session) return;
    const { error } = await saveUserCreation({ toolId: state.toolId, resultUrl });
    target.textContent = error ? "保存失败" : "已保存";
    target.disabled = !error;
    return;
  }
  if (target.matches("[data-result-to-video]")) {
    const resultUrl = getTaskResultUrl(task);
    if (!resultUrl) return;
    sessionStorage.setItem("luravyn:image-to-video-source", JSON.stringify({
      sourceTaskId: task.id || null,
      resultUrl,
      createdAt: new Date().toISOString(),
    }));
    window.location.href = "./tool.html?tool=image-to-video";
  }
}

function updatePolling() {
  if (state.pollTimer) window.clearInterval(state.pollTimer);
  const active = state.currentTask && ACTIVE_TASK_STATUSES.has(String(state.currentTask.status || "").toLowerCase());
  if (!active || !state.session) return;
  state.pollTimer = window.setInterval(() => {
    loadWorkspaceData().catch(() => {});
  }, 5000);
}

function bindEvents() {
  const input = root.querySelector("[data-asset-input]");
  const dropzone = root.querySelector("[data-asset-dropzone]");
  input?.addEventListener("change", () => handleFiles(input.files));
  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));
  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
    handleFiles(event.dataTransfer?.files);
  });
  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-generation-prompt]")) {
      updatePromptCount();
      updateSubmitState();
    }
    if (event.target.matches('[data-editor-output="creativity"]')) {
      const value = event.target.closest(".workspace-field")?.querySelector("[data-editor-range-value]");
      if (value) value.textContent = event.target.value;
    }
    if (event.target.matches("[data-face-option='fusionStrength']")) {
      const value = root.querySelector("[data-face-fusion-value]");
      if (value) value.textContent = event.target.value;
    }
    if (event.target.matches("[data-effect-search]")) {
      state.effectPickerQuery = event.target.value;
      renderEffectPicker();
    }
    if (event.target.matches("[data-video-motion-strength]")) {
      const value = root.querySelector("[data-video-motion-value]");
      if (value) value.textContent = event.target.value;
      renderAccountSummary();
      updateSubmitState();
    }
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-prompt-history]")) {
      const index = Number(event.target.value);
      const prompt = Number.isInteger(index) ? state.promptHistory[index] : "";
      const inputNode = root.querySelector("[data-generation-prompt]");
      if (inputNode && prompt) {
        inputNode.value = prompt;
        updatePromptCount();
        updateSubmitState();
      }
    }
    if (event.target.matches("[data-video-duration], [data-video-ratio], [data-video-camera-motion], [data-video-resolution], [data-video-output-count], [data-video-face-stability], [data-video-loop]")) {
      renderAccountSummary();
      updateSubmitState();
    }
  });
  root.addEventListener("mouseover", (event) => {
    const card = event.target.closest?.(".effect-picker-card");
    const video = card?.querySelector("video");
    if (video && window.matchMedia("(hover: hover)").matches) video.play().catch(() => {});
  });
  root.addEventListener("mouseout", (event) => {
    const card = event.target.closest?.(".effect-picker-card");
    if (!card || card.contains(event.relatedTarget)) return;
    const video = card.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });
  root.addEventListener("click", (event) => {
    if (event.target.matches("[data-effect-picker]")) {
      state.effectPickerOpen = false;
      renderEffectPicker();
      return;
    }
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.matches("[data-prompt-example]")) {
      const prompt = root.querySelector("[data-generation-prompt]");
      if (prompt) {
        prompt.value = target.dataset.promptExample || "";
        prompt.focus();
        updatePromptCount();
        updateSubmitState();
      }
      return;
    }
    if (target.matches("[data-editor-mode]")) {
      if (target.disabled) return;
      const nextMode = target.dataset.editorMode;
      if (!["single", "multi"].includes(nextMode) || nextMode === state.editorMode) return;
      state.editorMode = nextMode;
      state.editorActiveSlot = "main";
      resetEditorFiles(`已切换到${nextMode === "multi" ? "多图" : "单图"}模式，请重新选择素材。`);
      refreshImageEditorUi();
      return;
    }
    if (target.matches("[data-face-slot]")) {
      state.faceActiveSlot = target.dataset.faceSlot;
      renderFaceSwapSlots();
      if (input) input.value = "";
      input?.click();
      return;
    }
    if (target.matches("[data-face-target-index]")) {
      state.faceTargetIndex = Number(target.dataset.faceTargetIndex) || 0;
      renderFaceSwapSlots();
      updateSubmitState();
      return;
    }
    if (target.matches("[data-outfit-mode]")) {
      if (target.disabled) return;
      state.outfitMode = target.dataset.outfitMode;
      state.selectedEffect = null;
      refreshSpecialToolUi();
      updateSubmitState();
      return;
    }
    if (target.matches("[data-pose-mode]")) {
      state.poseMode = target.dataset.poseMode;
      state.selectedEffect = null;
      refreshSpecialToolUi();
      updateSubmitState();
      return;
    }
    if (target.matches("[data-reference-outfit-upload]")) {
      if (target.disabled) return;
      state.uploadPurpose = "referenceOutfit";
      if (input) input.value = "";
      input?.click();
      return;
    }
    if (target.matches("[data-open-effect-picker]")) {
      state.effectPickerOpen = true;
      state.effectPickerQuery = "";
      state.effectPickerCategory = "全部";
      renderEffectPicker();
      root.querySelector("[data-effect-search]")?.focus();
      return;
    }
    if (target.matches("[data-close-effect-picker]")) {
      state.effectPickerOpen = false;
      renderEffectPicker();
      return;
    }
    if (target.matches("[data-effect-category]")) {
      state.effectPickerCategory = target.dataset.effectCategory;
      renderEffectPicker();
      return;
    }
    if (target.matches("[data-effect-sort]")) {
      state.effectPickerSort = target.dataset.effectSort;
      root.querySelectorAll("[data-effect-sort]").forEach((button) => button.classList.toggle("is-active", button === target));
      renderEffectPicker();
      return;
    }
    if (target.matches("[data-effect-id]")) {
      state.selectedEffect = target.dataset.effectId;
      renderEffectPicker();
      refreshSpecialToolUi();
      renderAccountSummary();
      updateSubmitState();
      return;
    }
    if (target.matches("[data-confirm-effect]")) {
      const effect = getSelectedEffect();
      if (!isEffectSelectable(effect)) return;
      state.effectPickerOpen = false;
      const prompt = root.querySelector("[data-generation-prompt]");
      if (prompt && effect.prompt_template) prompt.value = effect.prompt_template;
      refreshSpecialToolUi();
      renderAccountSummary();
      updateSubmitState();
      return;
    }
    if (target.matches("[data-editor-operation]")) {
      const operation = IMAGE_EDITOR_OPERATIONS.find((item) => item.id === target.dataset.editorOperation);
      if (!operation) return;
      state.editorOperation = operation.id;
      root.querySelectorAll("[data-editor-operation]").forEach((button) => {
        button.classList.toggle("is-active", button === target);
      });
      const prompt = root.querySelector("[data-generation-prompt]");
      if (prompt) {
        prompt.value = operation.prompt;
        prompt.focus();
        updatePromptCount();
        updateSubmitState();
      }
      return;
    }
    if (target.matches("[data-editor-slot]")) {
      state.editorActiveSlot = target.dataset.editorSlot;
      if (input) input.value = "";
      input?.click();
      return;
    }
    if (target.matches("[data-clear-prompt]")) {
      const prompt = root.querySelector("[data-generation-prompt]");
      if (prompt) {
        prompt.value = "";
        prompt.focus();
        state.editorOperation = "custom";
        root.querySelectorAll("[data-editor-operation]").forEach((button) => {
          button.classList.toggle("is-active", button.dataset.editorOperation === "custom");
        });
        updatePromptCount();
        updateSubmitState();
      }
      return;
    }
    if (target.matches("[data-optimize-prompt]")) {
      optimizeEditorPrompt().catch(() => {});
      return;
    }
    if (target.matches("[data-replace-assets]")) {
      if (input) input.value = "";
      input?.click();
    }
    if (target.matches("[data-clear-assets]")) {
      if (state.toolId === "image-editor") {
        resetEditorFiles();
        return;
      }
      if (state.toolId === "face-swap") {
        revokeFileUrls();
        state.files = [];
        state.faceSwapSlots = { source: null, target: null };
        state.faceTargetCount = null;
        state.faceTargetIndex = 0;
        if (input) input.value = "";
        renderFaceSwapSlots();
        renderFileList();
        setUploaderState("idle", "请分别上传源人脸和目标图片。");
        return;
      }
      revokeFileUrls();
      state.files = [];
      if (state.referenceOutfit?.previewUrl) URL.revokeObjectURL(state.referenceOutfit.previewUrl);
      state.referenceOutfit = null;
      if (input) input.value = "";
      renderFileList();
      setUploaderState("idle", "尚未选择文件。");
    }
    if (target.matches("[data-remove-asset]")) {
      const index = Number(target.dataset.removeAsset);
      const [removed] = state.files.splice(index, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      if (state.toolId === "image-editor" && removed?.slotKey) {
        state.editorSlots[removed.slotKey] = null;
        syncEditorFiles();
        renderEditorSlots();
      }
      if (state.toolId === "face-swap" && removed?.slotKey) {
        state.faceSwapSlots[removed.slotKey] = null;
        if (removed.slotKey === "target") {
          state.faceTargetCount = null;
          state.faceTargetIndex = 0;
        }
        syncFaceSwapFiles();
        renderFaceSwapSlots();
      }
      renderFileList();
      const validCount = state.toolId === "face-swap"
        ? Boolean(state.faceSwapSlots.source && state.faceSwapSlots.target)
        : state.toolId === "image-editor"
        ? Boolean(state.editorSlots.main) && (
          state.editorMode === "single" ||
          getSupportedEditorSlots().some((slot) => slot.key !== "main" && state.editorSlots[slot.key])
        )
        : state.files.length >= state.tool.minFiles && state.files.length <= state.tool.maxFiles;
      setUploaderState(validCount ? "ready" : "invalid", validCount ? "剩余素材仍满足数量要求。" : `还需要 ${Math.max(0, state.tool.minFiles - state.files.length)} 张图片。`);
    }
    if (target.matches("[data-generation-submit]")) submitGeneration();
    handleResultAction(target).catch(() => {});
  });
  window.addEventListener("beforeunload", (event) => {
    const uploading = ["uploading", "validating"].includes(state.uploaderStatus);
    const generating = state.currentTask && ACTIVE_TASK_STATUSES.has(String(state.currentTask.status || "").toLowerCase());
    if (!uploading && !generating) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !state.effectPickerOpen) return;
    state.effectPickerOpen = false;
    renderEffectPicker();
  });
}

function applyLocalQaState() {
  const hostname = window.location.hostname;
  if (!["127.0.0.1", "localhost"].includes(hostname)) return;
  const params = new URLSearchParams(window.location.search);
  const qaAuth = params.get("qaAuth");
  const qaBalance = Number(params.get("qaBalance"));
  const qaCost = Number(params.get("qaCost"));
  const qaUpload = params.get("qaUpload");
  if (qaAuth === "logged") {
    state.session = { user: { id: "qa-user", email: "qa@example.invalid" } };
    state.balance = Number.isFinite(qaBalance) ? qaBalance : 100;
  } else if (qaAuth === "guest") {
    state.session = null;
    state.balance = null;
  }
  if (Number.isFinite(qaCost) && qaCost > 0) {
    state.catalogTool = {
      id: "qa-tool",
      slug: state.toolId,
      status: "active",
      credits_cost: qaCost,
      free_credits: 0,
      cost_per_run: qaCost,
    };
    state.workflow = {
      id: "qa-workflow",
      workflow_id: "qa-workflow",
      status: "active",
      cost: qaCost,
      input_schema: { prompt: { type: "string" } },
      output_schema: { result_url: { type: "string" } },
    };
  }
  if (state.toolId === "image-editor" && params.get("qaEditor") === "full") {
    state.workflow = {
      ...(state.workflow || {}),
      id: "qa-image-editor-workflow",
      workflow_id: "qa-image-editor-workflow",
      status: "active",
      input_schema: {
        prompt: { type: "string" },
        operation: { type: "string" },
        image: { type: "string" },
        reference_face: { type: "string" },
        reference_outfit: { type: "string" },
        reference_scene: { type: "string" },
        aspectRatio: { type: "string" },
        imageCount: { type: "number" },
        resolution: { type: "string" },
        preserveFace: { type: "boolean" },
        creativity: { type: "number" },
      },
      output_schema: { result_url: { type: "string" } },
    };
  }
  if (params.get("qaSpecial") === "full" && ["face-swap", "outfit-studio", "pose-generator", "image-to-video"].includes(state.toolId)) {
    state.qaActivePresets = true;
    const inputSchema = state.toolId === "face-swap"
      ? {
          prompt: { type: "string" },
          source_face: { type: "string" },
          target_image: { type: "string" },
          preserve_hair: { type: "boolean" },
          preserve_expression: { type: "boolean" },
          fusion_strength: { type: "number" },
        }
      : state.toolId === "outfit-studio"
        ? { prompt: { type: "string" }, image: { type: "string" }, effect: { type: "string" }, reference_outfit: { type: "string" } }
        : state.toolId === "pose-generator"
          ? { prompt: { type: "string" }, image: { type: "string" }, effect: { type: "string" }, angle: { type: "string" }, camera: { type: "string" } }
          : {
              prompt: { type: "string" },
              image: { type: "string" },
              duration: { type: "integer", enum: [2, 5, 10], default: 5 },
              aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1"], default: "16:9" },
              cameraMotion: { type: "string", enum: ["固定", "推进", "拉远", "平移"], default: "固定" },
              motionStrength: { type: "number", minimum: 0, maximum: 100, default: 50 },
              faceStability: { type: "boolean", default: true },
              loop: { type: "boolean", default: false },
              resolution: { type: "string", enum: ["720p", "1080p"], default: "720p" },
              outputCount: { type: "integer", enum: [1, 2], default: 1 },
              pricing: {
                duration_costs: { "2": 24, "5": 36, "10": 60 },
                resolution_multipliers: { "720p": 1, "1080p": 1.5 },
                output_multipliers: { "1": 1, "2": 2 },
              },
            };
    state.workflow = {
      ...(state.workflow || {}),
      id: `qa-${state.toolId}-workflow`,
      workflow_id: `qa-${state.toolId}-workflow`,
      status: "active",
      input_schema: inputSchema,
      output_schema: { result_url: { type: "string" } },
    };
  }
  if (qaUpload === "failed") {
    setUploaderState("failed", "本地验收：文件读取失败，请重新选择。");
  }
  const qaState = params.get("qaState");
  if (qaState) {
    const normalized = normalizeStatus(qaState);
    if (["queued", "processing", "completed", "failed", "cancelled"].includes(normalized)) {
      const qaStage = params.get("qaStage");
      const allowedQaStages = new Set(["uploading", "queued", "model_preparing", "generating", "post_processing", "uploading_result"]);
      const qaRawStatus = ["timeout", "timed_out"].includes(String(qaState).toLowerCase()) ? qaState : normalized;
      state.localTask = {
        id: `qa-${normalized}`,
        status: qaRawStatus,
        progress: 0,
        created_at: new Date().toISOString(),
        media_type: state.tool.mediaType,
        cost_credits: Number.isFinite(qaCost) && qaCost > 0 ? qaCost : 12,
        error_message: normalized === "failed" && !["timeout", "timed_out"].includes(String(qaState).toLowerCase())
          ? "本地验收：服务端返回输入图片不符合要求。"
          : null,
        result_url: "",
        input_params: { stage: allowedQaStages.has(qaStage) ? qaStage : undefined },
      };
      if (normalized === "failed" && params.get("qaRefund") === "true") {
        state.refunds.set(state.localTask.id, {
          source_id: state.localTask.id,
          balance_impact: state.localTask.cost_credits,
          operation_category: "generation_refund",
          status: "posted",
        });
      }
      renderResult(state.localTask);
    }
  }
  renderAccountSummary();
  renderHistory();
  refreshImageEditorUi();
  refreshSpecialToolUi();
  updateSubmitState();
}

async function init() {
  if (!root) return;
  state.toolId = getToolId();
  state.tool = TOOL_DEFINITIONS[state.toolId];
  if (state.toolId === "image-to-video") state.selectedEffect = "video-g20";
  loadPromptHistory();
  renderShell();
  if (state.tool.uploadOptional) {
    state.uploaderStatus = "ready";
    state.uploaderMessage = "未上传参考图；可直接使用文字描述。";
  }
  bindEvents();
  renderFileList();
  if (state.tool.uploadOptional) {
    setUploaderState("ready", state.uploaderMessage);
  }
  renderEmptyResult();
  renderHistory();
  renderAccountSummary();
  refreshImageEditorUi();
  refreshSpecialToolUi();
  updatePromptCount();
  updateSubmitState();
  applyLocalQaState();
  await loadWorkspaceData();
  applyLocalQaState();
}

init().catch((error) => {
  const message = root?.querySelector("[data-submit-reason]");
  if (message) message.textContent = error?.message || "工作台初始化失败。";
});
