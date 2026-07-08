PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  account_status TEXT NOT NULL DEFAULT 'active',
  role TEXT NOT NULL DEFAULT 'user',
  locale TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  onboarding_state TEXT NOT NULL DEFAULT 'not_started',
  last_active_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);

CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  removed_at TEXT,
  UNIQUE(workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id, status);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_time ON projects(workspace_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  platforms_json TEXT NOT NULL DEFAULT '[]',
  connected_accounts_json TEXT NOT NULL DEFAULT '[]',
  content_style TEXT NOT NULL DEFAULT '',
  posting_frequency TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  target_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  character_id TEXT,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  research_notes TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  hashtags_json TEXT NOT NULL DEFAULT '[]',
  translation_json TEXT NOT NULL DEFAULT '{}',
  cta TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'idea',
  review_status TEXT NOT NULL DEFAULT 'draft',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  scheduled_at TEXT,
  published_at TEXT,
  archived_at TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX IF NOT EXISTS idx_content_items_campaign_stage ON content_items(campaign_id, stage, updated_at);
CREATE INDEX IF NOT EXISTS idx_content_items_project ON content_items(project_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_content_items_owner ON content_items(owner_user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_content_items_review ON content_items(review_status);

CREATE TABLE IF NOT EXISTS content_pipeline_events (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_events_item ON content_pipeline_events(content_item_id, created_at);

CREATE TABLE IF NOT EXISTS platform_post_variants (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  hashtags_json TEXT NOT NULL DEFAULT '[]',
  cta TEXT NOT NULL DEFAULT '',
  media_format TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  connected_account_id TEXT,
  scheduled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id)
);

CREATE INDEX IF NOT EXISTS idx_platform_variants_item ON platform_post_variants(content_item_id);
CREATE INDEX IF NOT EXISTS idx_platform_variants_platform ON platform_post_variants(platform, status);

CREATE TABLE IF NOT EXISTS publishing_queue (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL,
  platform_variant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  queue_status TEXT NOT NULL DEFAULT 'needs_review',
  scheduled_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  FOREIGN KEY (platform_variant_id) REFERENCES platform_post_variants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_publishing_queue_user_status ON publishing_queue(user_id, queue_status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_publishing_queue_item ON publishing_queue(content_item_id);

CREATE TABLE IF NOT EXISTS content_analytics (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL,
  platform_variant_id TEXT,
  platform TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  website_visits INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  conversion_rate REAL NOT NULL DEFAULT 0,
  captured_at TEXT NOT NULL,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  FOREIGN KEY (platform_variant_id) REFERENCES platform_post_variants(id)
);

CREATE INDEX IF NOT EXISTS idx_content_analytics_item_time ON content_analytics(content_item_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_content_analytics_platform ON content_analytics(platform, captured_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  outcome TEXT NOT NULL,
  risk_classification TEXT NOT NULL DEFAULT 'low',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_type, actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  user_id TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT,
  amount INTEGER NOT NULL,
  balance_impact INTEGER NOT NULL,
  operation_category TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'posted',
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_credit_account_time ON credit_transactions(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_user_time ON credit_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_source ON credit_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_credit_operation ON credit_transactions(operation_category);
CREATE INDEX IF NOT EXISTS idx_credit_expiration ON credit_transactions(expires_at);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  project_id TEXT,
  character_id TEXT,
  generation_job_id TEXT,
  asset_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  preview_storage_key TEXT,
  display_name TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'ready',
  rights_status TEXT NOT NULL DEFAULT 'unknown',
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  visibility_status TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_media_owner_time ON media_assets(owner_user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_media_character ON media_assets(character_id);
CREATE INDEX IF NOT EXISTS idx_media_generation_job ON media_assets(generation_job_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_processing ON media_assets(processing_status);
CREATE INDEX IF NOT EXISTS idx_media_rights ON media_assets(rights_status);
CREATE INDEX IF NOT EXISTS idx_media_moderation ON media_assets(moderation_status);
CREATE INDEX IF NOT EXISTS idx_media_visibility ON media_assets(visibility_status);
CREATE INDEX IF NOT EXISTS idx_media_favorite ON media_assets(is_favorite);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  character_type TEXT NOT NULL DEFAULT 'persona',
  reference_asset_id TEXT,
  cover_asset_id TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  memory_json TEXT NOT NULL DEFAULT '{}',
  consistency_status TEXT NOT NULL DEFAULT 'draft',
  prompt_seed TEXT NOT NULL DEFAULT '',
  rights_status TEXT NOT NULL DEFAULT 'unknown',
  safety_status TEXT NOT NULL DEFAULT 'pending',
  visibility_status TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (reference_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (cover_asset_id) REFERENCES media_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_characters_owner_name ON characters(owner_user_id, name);
CREATE INDEX IF NOT EXISTS idx_characters_type ON characters(character_type);
CREATE INDEX IF NOT EXISTS idx_characters_rights ON characters(rights_status);
CREATE INDEX IF NOT EXISTS idx_characters_safety ON characters(safety_status);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  project_id TEXT,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'local_api',
  model TEXT NOT NULL DEFAULT 'local-stub-v0',
  tool_slug TEXT,
  workflow_id TEXT,
  workflow_version TEXT,
  input_params TEXT NOT NULL DEFAULT '{}',
  output_assets TEXT NOT NULL DEFAULT '[]',
  aspect_ratio TEXT NOT NULL,
  resolution TEXT,
  duration_seconds INTEGER,
  source_asset_id TEXT,
  character_id TEXT,
  result_asset_id TEXT,
  credit_transaction_id TEXT,
  cost_credits INTEGER NOT NULL,
  credit_charged INTEGER,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  estimated_cost INTEGER,
  latency INTEGER,
  progress INTEGER NOT NULL DEFAULT 0,
  safety_status TEXT NOT NULL DEFAULT 'pending_review',
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (source_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (character_id) REFERENCES characters(id),
  FOREIGN KEY (result_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (credit_transaction_id) REFERENCES credit_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_time ON generation_jobs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_project ON generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_character ON generation_jobs(character_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_media_type ON generation_jobs(media_type);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_provider_model ON generation_jobs(provider, model);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_tool_workflow ON generation_jobs(tool_slug, workflow_id, workflow_version);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_result ON generation_jobs(result_asset_id);

CREATE TABLE IF NOT EXISTS ai_workers (
  worker_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  workflow TEXT NOT NULL,
  worker_type TEXT NOT NULL DEFAULT 'image',
  status TEXT NOT NULL DEFAULT 'idle',
  queue_count INTEGER NOT NULL DEFAULT 0,
  average_latency INTEGER NOT NULL DEFAULT 0,
  success_rate INTEGER NOT NULL DEFAULT 100,
  cost_per_job INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TEXT NOT NULL,
  recent_failure_reason TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_workers_provider_status ON ai_workers(provider, status);

CREATE TABLE IF NOT EXISTS workflow_configs (
  workflow_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  json_config TEXT NOT NULL DEFAULT '{}',
  required_models TEXT NOT NULL DEFAULT '[]',
  required_inputs TEXT NOT NULL DEFAULT '[]',
  output_type TEXT NOT NULL,
  credit_price INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_configs_status ON workflow_configs(status, provider);

CREATE TABLE IF NOT EXISTS prompt_library (
  prompt_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  use_case TEXT NOT NULL DEFAULT '',
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT NOT NULL DEFAULT '',
  variables TEXT NOT NULL DEFAULT '[]',
  model TEXT NOT NULL DEFAULT 'local-demo',
  version TEXT NOT NULL DEFAULT 'v1',
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompt_library_status ON prompt_library(status, category);

CREATE TABLE IF NOT EXISTS tool_versions (
  id TEXT PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  version TEXT NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  model_version TEXT NOT NULL DEFAULT '',
  workflow_version TEXT NOT NULL DEFAULT '',
  prompt_version TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(tool_slug, version)
);

CREATE INDEX IF NOT EXISTS idx_tool_versions_slug_status ON tool_versions(tool_slug, status);

CREATE TABLE IF NOT EXISTS content_intelligence (
  id TEXT PRIMARY KEY,
  source_platform TEXT NOT NULL,
  source_url TEXT,
  account_name TEXT,
  post_text TEXT NOT NULL DEFAULT '',
  media_urls TEXT NOT NULL DEFAULT '[]',
  analysis_json TEXT NOT NULL DEFAULT '{}',
  hook TEXT,
  topic TEXT,
  target_audience TEXT,
  content_angle TEXT,
  reusable_strategy TEXT,
  generated_post_variants TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_intelligence_platform_status ON content_intelligence(source_platform, status);

CREATE TABLE IF NOT EXISTS agent_configs (
  agent_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  temperature REAL NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  tools_enabled TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_role_status ON agent_configs(role, status);

CREATE TABLE IF NOT EXISTS cost_analytics (
  id TEXT PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_workflow TEXT NOT NULL,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  success_jobs INTEGER NOT NULL DEFAULT 0,
  failed_jobs INTEGER NOT NULL DEFAULT 0,
  total_credit_charged INTEGER NOT NULL DEFAULT 0,
  estimated_api_cost INTEGER NOT NULL DEFAULT 0,
  estimated_gpu_cost INTEGER NOT NULL DEFAULT 0,
  gross_profit INTEGER NOT NULL DEFAULT 0,
  profit_margin INTEGER NOT NULL DEFAULT 0,
  captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cost_analytics_tool_provider ON cost_analytics(tool_slug, provider, captured_at);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  project_id TEXT,
  media_asset_id TEXT NOT NULL UNIQUE,
  generation_job_id TEXT,
  character_id TEXT,
  prompt TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  format TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  rights_status TEXT NOT NULL DEFAULT 'unknown',
  visibility_status TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX IF NOT EXISTS idx_images_owner_time ON images(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_images_job ON images(generation_job_id);
CREATE INDEX IF NOT EXISTS idx_images_moderation ON images(moderation_status);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  project_id TEXT,
  media_asset_id TEXT NOT NULL UNIQUE,
  generation_job_id TEXT,
  character_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  duration_seconds INTEGER,
  aspect_ratio TEXT NOT NULL,
  generation_source TEXT NOT NULL DEFAULT 'ai_generation',
  review_status TEXT NOT NULL DEFAULT 'pending',
  export_status TEXT NOT NULL DEFAULT 'not_started',
  visibility_status TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX IF NOT EXISTS idx_videos_owner_time ON videos(owner_user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_videos_job ON videos(generation_job_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_review ON videos(review_status);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider_reference TEXT,
  order_type TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  credits_granted INTEGER NOT NULL DEFAULT 0,
  credit_transaction_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (credit_transaction_id) REFERENCES credit_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_account_time ON orders(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders(provider_reference);

CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  media_asset_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  visibility_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_share_links_owner ON share_links(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_share_links_asset ON share_links(media_asset_id);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  generation_job_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  input_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT NOT NULL DEFAULT '{}',
  error_code TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  fallback_provider TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  resolution TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_time ON ai_jobs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_provider_model ON ai_jobs(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_generation_job ON ai_jobs(generation_job_id);

CREATE TABLE IF NOT EXISTS ai_cost_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ai_job_id TEXT NOT NULL,
  generation_job_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL,
  credits INTEGER NOT NULL,
  estimated_cost_cents INTEGER NOT NULL,
  duration_ms INTEGER,
  resolution TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id),
  FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_cost_user_time ON ai_cost_records(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cost_job ON ai_cost_records(ai_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_provider_model ON ai_cost_records(provider, model);
