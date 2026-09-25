import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';

export default async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard/summary
  app.get('/api/dashboard/summary', { preHandler: [authenticate] }, async (req, reply) => {
    const workspaceId = req.user.workspace_id;

    const [criticalResult, highResult, mediumResult, regulationsResult, overdueResult, coverageResult] = await Promise.all([
      db.query("SELECT COUNT(*) FROM gaps WHERE workspace_id = $1 AND severity = 'critical' AND status = 'open'", [workspaceId]),
      db.query("SELECT COUNT(*) FROM gaps WHERE workspace_id = $1 AND severity = 'high' AND status = 'open'", [workspaceId]),
      db.query("SELECT COUNT(*) FROM gaps WHERE workspace_id = $1 AND severity = 'medium' AND status = 'open'", [workspaceId]),
      db.query("SELECT COUNT(*) FROM regulations WHERE workspace_id = $1 AND ingested_at > now() - interval '7 days'", [workspaceId]),
      db.query("SELECT COUNT(*) FROM remediation_tasks WHERE workspace_id = $1 AND due_date < CURRENT_DATE AND status NOT IN ('done', 'cancelled')", [workspaceId]),
      db.query("SELECT AVG(coverage_score) FROM gap_analyses WHERE workspace_id = $1 AND analysis_status = 'complete'", [workspaceId]),
    ]);

    return reply.send({
      open_critical: parseInt(criticalResult.rows[0].count),
      open_high: parseInt(highResult.rows[0].count),
      open_medium: parseInt(mediumResult.rows[0].count),
      regulations_last_7_days: parseInt(regulationsResult.rows[0].count),
      overdue_tasks: parseInt(overdueResult.rows[0].count),
      coverage_score: parseFloat(coverageResult.rows[0].avg || '0') || 0,
    });
  });

  // GET /api/dashboard/timeline
  app.get('/api/dashboard/timeline', { preHandler: [authenticate] }, async (req, reply) => {
    const result = await db.query(
      'SELECT * FROM compliance_snapshots WHERE workspace_id = $1 ORDER BY snapshot_date ASC LIMIT 30',
      [req.user.workspace_id],
    );
    return reply.send({ snapshots: result.rows });
  });

  // GET /api/regulations
  app.get('/api/regulations', { preHandler: [authenticate] }, async (req, reply) => {
    const { jurisdiction, page = '1', limit = '20' } = req.query as {
      jurisdiction?: string; page?: string; limit?: string;
    };
    const workspaceId = req.user.workspace_id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM regulations WHERE workspace_id = $1';
    const params: unknown[] = [workspaceId];

    if (jurisdiction) { query += ' AND jurisdiction = $2'; params.push(jurisdiction); }
    query += ` ORDER BY ingested_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM regulations WHERE workspace_id = $1', [workspaceId]);

    return reply.send({ regulations: result.rows, total: parseInt(countResult.rows[0].count) });
  });

  // POST /api/regulations/ingest — manually add a regulation
  app.post('/api/regulations/ingest', { preHandler: [authenticate] }, async (req, reply) => {
    const { title, body_text, jurisdiction, source_url } = req.body as {
      title: string; body_text: string; jurisdiction: string; source_url?: string;
    };

    if (!title || !body_text || !jurisdiction) {
      return reply.status(400).send({ error: 'title, body_text, and jurisdiction are required' });
    }

    const result = await db.query(
      `INSERT INTO regulations (title, body_text, jurisdiction, source_url, workspace_id, published_at)
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
      [title, body_text, jurisdiction, source_url || null, req.user.workspace_id],
    );

    return reply.status(201).send({ regulation: result.rows[0] });
  });

  // GET /api/workers/status
  app.get('/api/workers/status', { preHandler: [authenticate] }, async (req, reply) => {
    const feeds = await db.query('SELECT * FROM regulatory_feeds ORDER BY name');
    return reply.send({ feeds: feeds.rows });
  });

  // GET /api/jurisdictions
  app.get('/api/jurisdictions', async (_req, reply) => {
    const jurisdictions = [
      { code: 'EU', name: 'European Union', description: 'EUR-Lex — AI Act, GDPR, MiFID II', status: 'active' },
      { code: 'US Federal', name: 'US Federal', description: 'Federal Register, SEC, CFTC', status: 'active' },
      { code: 'UK', name: 'United Kingdom', description: 'FCA, PRA, ICO', status: 'active' },
      { code: 'Nigeria', name: 'Nigeria', description: 'CBN, SEC Nigeria, NITDA', status: 'active' },
      { code: 'US State', name: 'US State', description: 'California CCPA, NY DFS, state AI bills', status: 'beta' },
    ];
    return reply.send({ jurisdictions });
  });
}
