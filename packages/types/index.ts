// Shared TypeScript types for ArkComply

export interface User {
  id: string;
  email: string;
  full_name?: string;
  workspace_id: string;
  role: 'analyst' | 'reviewer' | 'approver' | 'admin';
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  slack_webhook_url?: string;
  plan: string;
  jurisdiction_config: Record<string, boolean>;
  created_at: string;
}

export interface Regulation {
  id: string;
  title: string;
  body_text: string;
  source_url?: string;
  jurisdiction: string;
  published_at?: string;
  impact_categories: string[];
  severity_score?: number;
  ai_summary?: string;
  ai_classification?: Record<string, unknown>;
  ingested_at: string;
}

export interface Policy {
  id: string;
  workspace_id: string;
  filename: string;
  storage_path: string;
  file_size_bytes?: number;
  page_count?: number;
  index_status: 'pending' | 'indexing' | 'indexed' | 'error';
  control_count: number;
  uploaded_at: string;
}

export interface PolicyControl {
  id: string;
  policy_id: string;
  control_text: string;
  control_category?: string;
  page_number?: number;
  extracted_at: string;
}

export interface GapAnalysis {
  id: string;
  workspace_id: string;
  regulation_id?: string;
  analysis_status: 'pending' | 'running' | 'complete' | 'error';
  gap_count_critical: number;
  gap_count_high: number;
  gap_count_medium: number;
  coverage_score?: number;
  raw_input_text?: string;
  completed_at?: string;
  created_at: string;
}

export interface Gap {
  id: string;
  analysis_id: string;
  gap_title: string;
  gap_description: string;
  severity: 'critical' | 'high' | 'medium';
  obligation_text?: string;
  coverage_status: 'covered' | 'partial' | 'missing';
  recommended_action?: string;
  owner_id?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  due_date?: string;
  created_at: string;
  regulation_title?: string;
  regulation_jurisdiction?: string;
}

export interface RemediationTask {
  id: string;
  gap_id?: string;
  title: string;
  description: string;
  regulatory_citation?: string;
  assignee_id?: string;
  due_date?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  is_ai_generated: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  created_at: string;
}

export interface DashboardSummary {
  open_critical: number;
  open_high: number;
  open_medium: number;
  regulations_last_7_days: number;
  overdue_tasks: number;
  coverage_score: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
