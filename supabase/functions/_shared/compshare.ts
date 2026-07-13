export interface CompShareRuntimeConfig {
  baseUrl: string;
  publicKey: string;
  privateKey: string;
  projectId: string;
  region: string;
  zone: string;
  instanceId: string;
  coldStartTimeoutMs: number;
  pollIntervalMs: number;
  idleShutdownSeconds: number;
}

type FetchLike = typeof fetch;

export async function ensureCompShareInstanceReady(
  config: CompShareRuntimeConfig,
  gatewayHealthUrl: string,
  fetcher: FetchLike = fetch,
): Promise<void> {
  if (!config.instanceId) return;
  validateConfig(config);

  let state = await describeState(config, fetcher);
  if (state === "Stopped") {
    await invokeCompShare(config, "StartCompShareInstance", { UHostId: config.instanceId }, fetcher);
    state = "Starting";
  }
  if (!["Running", "Starting"].includes(state)) {
    throw new Error(`COMPSHARE_INSTANCE_UNAVAILABLE: instance is ${state || "unknown"}`);
  }

  const deadline = Date.now() + config.coldStartTimeoutMs;
  while (state !== "Running" && Date.now() < deadline) {
    await delay(config.pollIntervalMs);
    state = await describeState(config, fetcher);
  }
  if (state !== "Running") {
    throw new Error("COMPSHARE_COLD_START_TIMEOUT: instance did not reach Running state");
  }

  // A long safety window protects active video jobs. It is shortened after the job finishes.
  await scheduleCompShareShutdown(config, Math.max(config.idleShutdownSeconds, 7200), fetcher);
  await waitForGateway(gatewayHealthUrl, config, fetcher);
}

export async function scheduleCompShareShutdown(
  config: CompShareRuntimeConfig,
  secondsFromNow = config.idleShutdownSeconds,
  fetcher: FetchLike = fetch,
): Promise<void> {
  if (!config.instanceId) return;
  validateConfig(config);
  const delaySeconds = Math.max(300, Math.floor(secondsFromNow));
  const projectId = config.projectId || await resolveProjectId(config, fetcher);
  await invokeCompShare(config, "UpdateCompShareStopScheduler", {
    ProjectId: projectId,
    UHostId: config.instanceId,
    SchedulerStopTime: Math.floor(Date.now() / 1000) + delaySeconds,
  }, fetcher);
}

async function resolveProjectId(config: CompShareRuntimeConfig, fetcher: FetchLike): Promise<string> {
  const data = await invokeCompShare(config, "GetProjectList", {}, fetcher);
  const projects = Array.isArray(data.ProjectSet) ? data.ProjectSet : [];
  const selected = projects.find((project: any) => project?.IsDefault) || projects[0];
  const projectId = String(selected?.ProjectId || "");
  if (!projectId) throw new Error("COMPSHARE_PROJECT_NOT_FOUND");
  return projectId;
}

export async function createUCloudSignature(params: Record<string, unknown>, privateKey: string): Promise<string> {
  const flattened = flattenUCloudParams(params);
  const payload = Object.keys(flattened)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => `${key}${flattened[key]}`)
    .join("") + privateKey;
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function flattenUCloudParams(params: Record<string, unknown>, prefix = ""): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        Object.assign(output, isRecord(item)
          ? flattenUCloudParams(item, `${path}.${index}`)
          : { [`${path}.${index}`]: encodeValue(item) });
      });
    } else if (isRecord(value)) {
      Object.assign(output, flattenUCloudParams(value, path));
    } else {
      output[path] = encodeValue(value);
    }
  }
  return output;
}

async function describeState(config: CompShareRuntimeConfig, fetcher: FetchLike): Promise<string> {
  const data = await invokeCompShare(config, "DescribeCompShareInstance", {
    "UHostIds.0": config.instanceId,
  }, fetcher);
  const instance = Array.isArray(data.UHostSet)
    ? data.UHostSet.find((entry: any) => String(entry?.UHostId || "") === config.instanceId)
    : null;
  if (!instance) throw new Error("COMPSHARE_INSTANCE_NOT_FOUND");
  return String(instance.State || "");
}

async function invokeCompShare(
  config: CompShareRuntimeConfig,
  action: string,
  input: Record<string, unknown>,
  fetcher: FetchLike,
): Promise<Record<string, any>> {
  const common = action === "GetProjectList"
    ? { Action: action, PublicKey: config.publicKey }
    : { Action: action, Region: config.region, Zone: config.zone, PublicKey: config.publicKey };
  const payload = flattenUCloudParams({ ...common, ...input });
  payload.Signature = await createUCloudSignature(payload, config.privateKey);
  const response = await fetcher(config.baseUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "U-Timestamp-Ms": String(Date.now()),
    },
    body: new URLSearchParams(payload).toString(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || Number(data.RetCode ?? -1) !== 0) {
    throw new Error(`COMPSHARE_API_FAILED: ${action}: ${data.Message || response.status}`);
  }
  return data;
}

async function waitForGateway(url: string, config: CompShareRuntimeConfig, fetcher: FetchLike) {
  const deadline = Date.now() + config.coldStartTimeoutMs;
  let lastStatus = 0;
  while (Date.now() < deadline) {
    try {
      const response = await fetcher(url, { method: "GET", headers: { Accept: "application/json" } });
      lastStatus = response.status;
      if (response.ok) return;
    } catch {
      lastStatus = 0;
    }
    await delay(config.pollIntervalMs);
  }
  throw new Error(`COMPSHARE_GATEWAY_TIMEOUT: health endpoint returned ${lastStatus || "no response"}`);
}

function validateConfig(config: CompShareRuntimeConfig) {
  if (!config.publicKey || !config.privateKey || !config.region || !config.zone || !config.baseUrl) {
    throw new Error("COMPSHARE_NOT_CONFIGURED: API credentials, region, zone, and base URL are required");
  }
}

function encodeValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
