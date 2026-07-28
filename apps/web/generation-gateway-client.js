import { supabase } from "./supabase-client.js";

const gatewayUrl = String(import.meta.env.VITE_GENERATION_GATEWAY_URL || "").replace(/\/+$/, "");
export const isGenerationGatewayConfigured = Boolean(gatewayUrl);

export const createGatewayGeneration = (input) => gatewayRequest("/v1/generations", { method: "POST", body: input });
export const getGatewayGeneration = (jobId) => gatewayRequest(`/v1/generations/${encodeURIComponent(jobId)}`);
export const cancelGatewayGeneration = (jobId) => gatewayRequest(`/v1/generations/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
export const retryGatewayGeneration = (jobId) => gatewayRequest(`/v1/generations/${encodeURIComponent(jobId)}/retry`, { method: "POST" });
export const analyzeGatewayReference = (input) => gatewayRequest("/v1/reference-analyses", { method: "POST", body: input });
export const confirmGatewayReferenceAnalysis = (analysisId, input) => gatewayRequest(
  `/v1/reference-analyses/${encodeURIComponent(analysisId)}/confirm`,
  { method: "PATCH", body: input }
);
export const listGatewayCharacters = () => gatewayRequest("/v1/characters");
export const ensureGatewayMockCharacter = () => gatewayRequest("/v1/characters/mock", { method: "POST" });
export const listGatewayWorkflows = () => gatewayRequest("/v1/admin/workflows");
export const patchGatewayWorkflow = (workflowId, patch) => gatewayRequest(
  `/v1/admin/workflows/${encodeURIComponent(workflowId)}`,
  { method: "PATCH", body: patch }
);
export const listGatewayWorkflowVersions = (workflowId) => gatewayRequest(
  `/v1/admin/workflows/${encodeURIComponent(workflowId)}/versions`
);
export const listGatewayLoras = () => gatewayRequest("/v1/admin/loras");
export const patchGatewayLora = (loraId, patch) => gatewayRequest(
  `/v1/admin/loras/${encodeURIComponent(loraId)}`,
  { method: "PATCH", body: patch }
);
export const listGatewayLoraVersions = (loraId) => gatewayRequest(
  `/v1/admin/loras/${encodeURIComponent(loraId)}/versions`
);

export async function waitForGatewayGeneration(jobId, options = {}) {
  const deadline = Date.now() + Number(options.timeoutMs || 180_000);
  while (Date.now() < deadline) {
    const result = await getGatewayGeneration(jobId);
    options.onStatus?.(result.job);
    if (["completed", "failed", "cancelled"].includes(result.job.status)) return result;
    await new Promise((resolve) => window.setTimeout(resolve, Number(options.intervalMs || 1000)));
  }
  throw Object.assign(new Error("任务仍在运行，请稍后在历史记录中查看。"), { job: { id: jobId, status: "running" } });
}

async function gatewayRequest(path, options = {}) {
  if (!gatewayUrl) throw new Error("Generation Gateway 未配置。");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("登录已失效，请重新登录。");
  const response = await fetch(`${gatewayUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Request-Id": crypto.randomUUID()
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Generation Gateway 请求失败 (${response.status})`);
    error.code = payload?.error?.code;
    error.retryable = Boolean(payload?.error?.retryable);
    error.job = payload?.job;
    throw error;
  }
  return payload;
}
