# ArkComply — Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
│  Next.js 15 App Router · Tailwind CSS · React 19                │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Dashboard │  │ Analyze  │  │  Gaps    │  │   Policies   │   │
│  │ /kpi     │  │ /paste   │  │ /list    │  │  /upload     │   │
│  │ /gaps    │  │ /stream  │  │ /detail  │  │  /controls   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / Bearer JWT
┌──────────────────────▼──────────────────────────────────────────┐
│                     Fastify v5 API (Port 3001)                   │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Auth Routes │  │ Gap Routes  │  │    Policy Routes        │ │
│  │ /register   │  │ /analyze    │  │    /upload              │ │
│  │ /login      │  │ /paste      │  │    /list                │ │
│  │ /me         │  │ /list       │  │    /controls            │ │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │               AI Service (ai.service.ts)                    │ │
│  │   analyzeRegulation() · generateRemediationTask()           │ │
│  │   extractPolicyControls()                                   │ │
│  └────────────────────────┬────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────▼──────────┐              ┌─────────▼──────────┐
│  Claude AI API     │              │   Neon Postgres     │
│  (Anthropic)       │              │   + pgvector        │
│                    │              │                      │
│  claude-opus-4-5   │              │  workspaces         │
│  - Rule classify   │              │  users              │
│  - Gap analysis    │              │  regulations        │
│  - Task generation │              │  policies           │
│  - Control extract │              │  policy_controls    │
└────────────────────┘              │  gap_analyses       │
                                    │  gaps               │
                                    │  remediation_tasks  │
                                    │  audit_log          │
                                    │  compliance_snap..  │
                                    └─────────────────────┘
```

## Database Schema

### workspaces
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | Workspace display name |
| slug | TEXT UNIQUE | URL-safe identifier |
| slack_webhook_url | TEXT | Optional Slack integration |
| plan | TEXT | free / pro |
| jurisdiction_config | JSONB | Per-jurisdiction settings |
| created_at | TIMESTAMPTZ | |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | bcrypt 12 rounds |
| full_name | TEXT | |
| workspace_id | UUID FK | workspaces.id |
| role | TEXT | analyst / reviewer / approver / admin |
| created_at | TIMESTAMPTZ | |

### regulations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| title | TEXT | |
| body_text | TEXT | Full regulatory text |
| jurisdiction | TEXT | EU / US Federal / UK / Nigeria |
| severity_score | INT | 1-10 AI-assigned |
| impact_categories | TEXT[] | data governance / AI risk / etc |
| ai_summary | TEXT | Claude-generated summary |
| ai_classification | JSONB | Full Claude classification |
| embedding | vector(1536) | For semantic search |
| workspace_id | UUID FK | |
| ingested_at | TIMESTAMPTZ | |

### policies
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| workspace_id | UUID FK | |
| filename | TEXT | Original filename |
| storage_path | TEXT | Where PDF is stored |
| index_status | TEXT | pending / indexing / indexed / error |
| control_count | INT | Number of extracted controls |
| uploaded_at | TIMESTAMPTZ | |

### policy_controls
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| policy_id | UUID FK | |
| control_text | TEXT | Extracted control statement |
| control_category | TEXT | data governance / AI risk / etc |
| embedding | vector(1536) | For semantic matching |
| extracted_at | TIMESTAMPTZ | |

### gap_analyses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| workspace_id | UUID FK | |
| triggered_by | UUID FK | users.id |
| analysis_status | TEXT | pending / running / complete / error |
| gap_count_critical | INT | |
| gap_count_high | INT | |
| gap_count_medium | INT | |
| coverage_score | NUMERIC | 0-100 |
| raw_input_text | TEXT | Original regulatory text |
| claude_response | JSONB | Full Claude analysis output |
| created_at | TIMESTAMPTZ | |

### gaps
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| analysis_id | UUID FK | |
| gap_title | TEXT | Short gap title |
| gap_description | TEXT | Detailed explanation |
| severity | TEXT | critical / high / medium |
| obligation_text | TEXT | The specific obligation |
| coverage_status | TEXT | covered / partial / missing |
| recommended_action | TEXT | Claude-suggested fix |
| owner_id | UUID FK NULLABLE | Assigned user |
| status | TEXT | open / in_progress / resolved / accepted_risk |
| due_date | DATE | |
| created_at | TIMESTAMPTZ | |

### remediation_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gap_id | UUID FK NULLABLE | |
| title | TEXT | |
| description | TEXT | |
| regulatory_citation | TEXT | |
| assignee_id | UUID FK NULLABLE | |
| due_date | DATE | |
| status | TEXT | todo / in_progress / review / done / cancelled |
| priority | TEXT | critical / high / medium / low |
| is_ai_generated | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### audit_log (immutable, append-only)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| workspace_id | UUID FK | |
| user_id | UUID FK NULLABLE | |
| entity_type | TEXT | gap / policy / task / gap_analysis |
| entity_id | UUID | Reference to changed entity |
| action | TEXT | create / update / delete / status_change |
| before_state | JSONB | Previous state (for updates) |
| after_state | JSONB | New state |
| created_at | TIMESTAMPTZ | |

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Create workspace + user |
| POST | /api/auth/login | No | Email+password → JWT |
| GET | /api/auth/me | Yes | Current user profile |

### Gap Analysis
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/gaps/analyze/paste | Yes | Paste text → Claude gap analysis |
| GET | /api/gaps | Yes | List gaps with filters |
| GET | /api/gaps/:id | Yes | Gap detail + tasks + audit |
| PUT | /api/gaps/:id/status | Yes | Update gap status |

### Policies
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/policies | Yes | List all policies |
| POST | /api/policies/upload | Yes | Upload PDF, extract controls |
| GET | /api/policies/:id | Yes | Policy + controls |
| DELETE | /api/policies/:id | Yes | Remove policy |

### Tasks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/tasks | Yes | List tasks |
| POST | /api/tasks | Yes | Create manual task |
| POST | /api/tasks/generate | Yes | AI-generate task from gap |
| PUT | /api/tasks/:id | Yes | Update task |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/dashboard/summary | Yes | KPI counts |
| GET | /api/dashboard/timeline | Yes | Compliance snapshots |
| GET | /api/regulations | Yes | Regulation feed |
| GET | /api/jurisdictions | No | Supported jurisdictions |
| GET | /api/workers/status | Yes | Feed sync status |

### Audit
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/audit | Yes | Immutable audit log |

## Frontend Routes

| Route | Description |
|-------|-------------|
| / | Marketing landing page |
| /auth/login | Email+password login |
| /auth/register | Workspace creation + signup |
| /dashboard | KPI cards, recent gaps, quick analysis CTA |
| /analyze | Paste any regulation → streaming gap analysis |
| /gaps | Gap list with severity/status filters |
| /gaps/[id] | Gap detail: obligation diff, remediation generator, audit trail |
| /policies | Policy library: upload zone, indexing status |
| /tasks | Kanban board: todo / in_progress / review / done |
| /regulations | Regulation feed viewer |
| /timeline | Compliance posture chart over time |
| /reports | PDF export hub |
| /settings | Workspace, feeds, team, integrations |
