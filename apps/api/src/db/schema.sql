-- ArkComply Database Schema
-- Run this once to initialize the database

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  slack_webhook_url TEXT,
  plan TEXT DEFAULT 'free',
  jurisdiction_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  role TEXT DEFAULT 'analyst' CHECK (role IN ('analyst', 'reviewer', 'approver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Regulatory Feeds
CREATE TABLE IF NOT EXISTS regulatory_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  feed_type TEXT CHECK (feed_type IN ('rss', 'api', 'scrape')),
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Regulations
CREATE TABLE IF NOT EXISTS regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES regulatory_feeds(id),
  external_id TEXT,
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  source_url TEXT,
  jurisdiction TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  impact_categories TEXT[] DEFAULT '{}',
  severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
  ai_summary TEXT,
  ai_classification JSONB,
  embedding vector(1536),
  workspace_id UUID REFERENCES workspaces(id),
  ingested_at TIMESTAMPTZ DEFAULT now()
);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  page_count INTEGER,
  index_status TEXT DEFAULT 'pending' CHECK (index_status IN ('pending', 'indexing', 'indexed', 'error')),
  control_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Policy Controls
CREATE TABLE IF NOT EXISTS policy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id),
  control_text TEXT NOT NULL,
  control_category TEXT,
  page_number INTEGER,
  embedding vector(1536),
  extracted_at TIMESTAMPTZ DEFAULT now()
);

-- Gap Analyses
CREATE TABLE IF NOT EXISTS gap_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  regulation_id UUID REFERENCES regulations(id),
  triggered_by UUID REFERENCES users(id),
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'running', 'complete', 'error')),
  gap_count_critical INTEGER DEFAULT 0,
  gap_count_high INTEGER DEFAULT 0,
  gap_count_medium INTEGER DEFAULT 0,
  coverage_score NUMERIC(5,2),
  raw_input_text TEXT,
  claude_response JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gaps
CREATE TABLE IF NOT EXISTS gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES gap_analyses(id),
  workspace_id UUID REFERENCES workspaces(id),
  regulation_id UUID REFERENCES regulations(id),
  gap_title TEXT NOT NULL,
  gap_description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium')),
  obligation_text TEXT,
  matched_control_id UUID REFERENCES policy_controls(id),
  coverage_status TEXT NOT NULL CHECK (coverage_status IN ('covered', 'partial', 'missing')),
  recommended_action TEXT,
  owner_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted_risk')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Remediation Tasks
CREATE TABLE IF NOT EXISTS remediation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id UUID REFERENCES gaps(id),
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  regulatory_citation TEXT,
  assignee_id UUID REFERENCES users(id),
  due_date DATE,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  is_ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Log (immutable, append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Snapshots
CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  snapshot_date DATE NOT NULL,
  open_critical INTEGER DEFAULT 0,
  open_high INTEGER DEFAULT 0,
  open_medium INTEGER DEFAULT 0,
  coverage_score NUMERIC(5,2),
  regulations_monitored INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Report Exports
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  generated_by UUID REFERENCES users(id),
  report_type TEXT DEFAULT 'gap_analysis',
  filters_used JSONB,
  storage_path TEXT NOT NULL,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_regulations_workspace ON regulations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulations_ingested_at ON regulations(ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_workspace ON policies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_policy_controls_policy ON policy_controls(policy_id);
CREATE INDEX IF NOT EXISTS idx_gap_analyses_workspace ON gap_analyses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gaps_workspace ON gaps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gaps_severity ON gaps(severity);
CREATE INDEX IF NOT EXISTS idx_gaps_status ON gaps(status);
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_workspace ON remediation_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_status ON remediation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_workspace ON audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Seed default regulatory feeds
INSERT INTO regulatory_feeds (name, jurisdiction, feed_url, feed_type) VALUES
  ('EUR-Lex (EU AI Act Updates)', 'EU', 'https://eur-lex.europa.eu/rss/rss.xml', 'rss'),
  ('US Federal Register', 'US Federal', 'https://www.federalregister.gov/documents/current.json', 'api'),
  ('FCA (Financial Conduct Authority)', 'UK', 'https://www.fca.org.uk/news/rss.xml', 'rss'),
  ('SEC (Securities and Exchange Commission)', 'US Federal', 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&dateb=&owner=include&count=20&search_text=&output=atom', 'rss'),
  ('CBN (Central Bank of Nigeria)', 'Nigeria', 'https://www.cbn.gov.ng/rss', 'rss')
ON CONFLICT DO NOTHING;
