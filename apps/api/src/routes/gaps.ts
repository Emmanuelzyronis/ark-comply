import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { analyzeRegulation, generateRemediationTask } from '../services/ai.service.js';
import { authenticate } from '../middleware/auth.js';

export default async function gapsRoutes(app: FastifyInstance) {
  // POST /api/gaps/analyze/paste — paste raw regulatory text
  app.post('/api/gaps/analyze/paste', { preHandler: [authenticate] }, async (req, reply) => {
    const { text } = req.body as { text: string };
    if (!text || text.trim().length < 50) {
      return reply.status(400).send({ error: 'Please provide at least 50 characters of regulatory text' });
    }

    const workspaceId = req.user.workspace_id;

    // Get existing policy controls for context
    const controlsResult = await db.query(
      'SELECT control_text FROM policy_controls WHERE workspace_id = $1 LIMIT 20',
      [workspaceId],
    );
    const controls = controlsResult.rows.map((r: { control_text: string }) => r.control_text);

    // Create gap analysis record
    const analysisResult = await db.query(
      `INSERT INTO gap_analyses (workspace_id, triggered_by, analysis_status, raw_input_text)
       VALUES ($1, $2, 'running', $3) RETURNING id`,
      [workspaceId, req.user.id, text],
    );
    const analysisId = analysisResult.rows[0].id;

    if (!process.env.ANTHROPIC_API_KEY) {
      await db.query("UPDATE gap_analyses SET analysis_status = 'error' WHERE id = $1", [analysisId]);
      return reply.status(503).send({ error: 'Claude API key not configured. Contact the administrator.' });
    }

    try {
      const result = await analyzeRegulation(text, controls);

      // Store gaps
      let criticalCount = 0, highCount = 0, mediumCount = 0;
      const gapIds: string[] = [];

      for (const obligation of result.obligations) {
        if (obligation.coverage_status !== 'covered') {
          const gapResult = await db.query(
            `INSERT INTO gaps (analysis_id, workspace_id, gap_title, gap_description, severity,
             obligation_text, coverage_status, recommended_action, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open') RETURNING id`,
            [
              analysisId, workspaceId,
              obligation.gap_title, obligation.gap_description,
              obligation.severity, obligation.obligation_text,
              obligation.coverage_status, obligation.recommended_action,
            ],
          );
          gapIds.push(gapResult.rows[0].id);
          if (obligation.severity === 'critical') criticalCount++;
          else if (obligation.severity === 'high') highCount++;
          else mediumCount++;
        }
      }

      // Update analysis record
      await db.query(
        `UPDATE gap_analyses SET analysis_status = 'complete', gap_count_critical = $1,
         gap_count_high = $2, gap_count_medium = $3, coverage_score = $4,
         claude_response = $5, completed_at = now() WHERE id = $6`,
        [criticalCount, highCount, mediumCount, result.overall_coverage_score, JSON.stringify(result), analysisId],
      );

      // Audit log
      await db.query(
        `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, after_state)
         VALUES ($1, $2, 'gap_analysis', $3, 'create', $4)`,
        [workspaceId, req.user.id, analysisId, JSON.stringify({ gap_count: gapIds.length, coverage_score: result.overall_coverage_score })],
      );

      return reply.send({
        analysis_id: analysisId,
        ...result,
        gap_ids: gapIds,
        gap_count_critical: criticalCount,
        gap_count_high: highCount,
        gap_count_medium: mediumCount,
      });
    } catch (error) {
      await db.query(
        "UPDATE gap_analyses SET analysis_status = 'error' WHERE id = $1",
        [analysisId],
      );
      app.log.error(error, 'Gap analysis failed');
      return reply.status(500).send({ error: 'Gap analysis failed. Please check your API key and try again.' });
    }
  });

  // GET /api/gaps — list gaps
  app.get('/api/gaps', { preHandler: [authenticate] }, async (req, reply) => {
    const { severity, status, page = '1', limit = '20' } = req.query as {
      severity?: string; status?: string; page?: string; limit?: string;
    };
    const workspaceId = req.user.workspace_id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT g.*, r.title as regulation_title, r.jurisdiction as regulation_jurisdiction
                 FROM gaps g LEFT JOIN regulations r ON g.regulation_id = r.id
                 WHERE g.workspace_id = $1`;
    const params: unknown[] = [workspaceId];
    let paramCount = 1;

    if (severity) { paramCount++; query += ` AND g.severity = $${paramCount}`; params.push(severity); }
    if (status) { paramCount++; query += ` AND g.status = $${paramCount}`; params.push(status); }

    paramCount++; query += ` ORDER BY g.created_at DESC LIMIT $${paramCount}`; params.push(parseInt(limit));
    paramCount++; query += ` OFFSET $${paramCount}`; params.push(offset);

    const result = await db.query(query, params);
    const countResult = await db.query(
      `SELECT COUNT(*) FROM gaps WHERE workspace_id = $1${severity ? ' AND severity = $2' : ''}`,
      severity ? [workspaceId, severity] : [workspaceId],
    );

    return reply.send({ gaps: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  });

  // GET /api/gaps/:id
  app.get('/api/gaps/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await db.query(
      `SELECT g.*, r.title as regulation_title, r.jurisdiction as regulation_jurisdiction,
              r.source_url as regulation_source_url
       FROM gaps g LEFT JOIN regulations r ON g.regulation_id = r.id
       WHERE g.id = $1 AND g.workspace_id = $2`,
      [id, req.user.workspace_id],
    );
    if (!result.rows[0]) return reply.status(404).send({ error: 'Gap not found' });

    // Get linked tasks
    const tasks = await db.query(
      'SELECT id, title, status, priority, due_date, is_ai_generated FROM remediation_tasks WHERE gap_id = $1',
      [id],
    );

    // Get audit trail
    const audit = await db.query(
      "SELECT * FROM audit_log WHERE entity_id = $1 ORDER BY created_at DESC LIMIT 20",
      [id],
    );

    return reply.send({ gap: result.rows[0], tasks: tasks.rows, audit_trail: audit.rows });
  });

  // PUT /api/gaps/:id/status
  app.put('/api/gaps/:id/status', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    const validStatuses = ['open', 'in_progress', 'resolved', 'accepted_risk'];
    if (!validStatuses.includes(status)) return reply.status(400).send({ error: 'Invalid status' });

    const before = await db.query('SELECT status FROM gaps WHERE id = $1 AND workspace_id = $2', [id, req.user.workspace_id]);
    if (!before.rows[0]) return reply.status(404).send({ error: 'Gap not found' });

    await db.query('UPDATE gaps SET status = $1 WHERE id = $2', [status, id]);
    await db.query(
      `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, before_state, after_state)
       VALUES ($1, $2, 'gap', $3, 'status_change', $4, $5)`,
      [req.user.workspace_id, req.user.id, id, JSON.stringify({ status: before.rows[0].status }), JSON.stringify({ status })],
    );

    return reply.send({ updated: true, status });
  });

  // POST /api/tasks/generate — Claude-drafted remediation task
  app.post('/api/tasks/generate', { preHandler: [authenticate] }, async (req, reply) => {
    const { gap_id } = req.body as { gap_id: string };
    const workspaceId = req.user.workspace_id;

    const gapResult = await db.query(
      'SELECT * FROM gaps WHERE id = $1 AND workspace_id = $2',
      [gap_id, workspaceId],
    );
    const gap = gapResult.rows[0];
    if (!gap) return reply.status(404).send({ error: 'Gap not found' });

    try {
      const task = await generateRemediationTask(
        gap.gap_title,
        gap.gap_description,
        gap.obligation_text || 'Regulatory obligation',
        gap.obligation_text || gap.gap_description,
      );

      const taskResult = await db.query(
        `INSERT INTO remediation_tasks (gap_id, workspace_id, title, description, regulatory_citation,
         due_date, priority, status, is_ai_generated, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'todo', true, $8) RETURNING *`,
        [gap_id, workspaceId, task.title, task.description, gap.obligation_text || '',
         task.due_date, task.priority, req.user.id],
      );

      const newTask = taskResult.rows[0];

      // Update gap status
      await db.query("UPDATE gaps SET status = 'in_progress' WHERE id = $1", [gap_id]);

      // Audit log
      await db.query(
        `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, after_state)
         VALUES ($1, $2, 'remediation_task', $3, 'ai_generated', $4)`,
        [workspaceId, req.user.id, newTask.id, JSON.stringify({ gap_id, title: newTask.title })],
      );

      return reply.status(201).send({ task: newTask });
    } catch (error) {
      app.log.error(error, 'Task generation failed');
      return reply.status(500).send({ error: 'Task generation failed' });
    }
  });

  // POST /api/tasks — manual task creation
  app.post('/api/tasks', { preHandler: [authenticate] }, async (req, reply) => {
    const { gap_id, title, description, priority, due_date, regulatory_citation } = req.body as {
      gap_id?: string; title: string; description: string; priority: string;
      due_date?: string; regulatory_citation?: string;
    };

    if (!title || !description || !priority) {
      return reply.status(400).send({ error: 'title, description, and priority are required' });
    }

    const taskResult = await db.query(
      `INSERT INTO remediation_tasks (gap_id, workspace_id, title, description, regulatory_citation,
       due_date, priority, status, is_ai_generated, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'todo', false, $8) RETURNING *`,
      [gap_id || null, req.user.workspace_id, title, description,
       regulatory_citation || null, due_date || null, priority, req.user.id],
    );

    await db.query(
      `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, after_state)
       VALUES ($1, $2, 'remediation_task', $3, 'create', $4)`,
      [req.user.workspace_id, req.user.id, taskResult.rows[0].id, JSON.stringify({ title, priority })],
    );

    return reply.status(201).send({ task: taskResult.rows[0] });
  });

  // GET /api/tasks
  app.get('/api/tasks', { preHandler: [authenticate] }, async (req, reply) => {
    const { status, page = '1', limit = '50' } = req.query as { status?: string; page?: string; limit?: string };
    const workspaceId = req.user.workspace_id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM remediation_tasks WHERE workspace_id = $1';
    const params: unknown[] = [workspaceId];

    if (status) { query += ' AND status = $2'; params.push(status); }
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const result = await db.query(query, params);
    return reply.send({ tasks: result.rows });
  });

  // PUT /api/tasks/:id
  app.put('/api/tasks/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const updates = req.body as { status?: string; assignee_id?: string; due_date?: string; title?: string; description?: string };
    const workspaceId = req.user.workspace_id;

    const existing = await db.query('SELECT * FROM remediation_tasks WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
    if (!existing.rows[0]) return reply.status(404).send({ error: 'Task not found' });

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return reply.status(400).send({ error: 'No fields to update' });

    paramCount++;
    values.push(id);
    await db.query(`UPDATE remediation_tasks SET ${fields.join(', ')} WHERE id = $${paramCount}`, values);

    await db.query(
      `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, before_state, after_state)
       VALUES ($1, $2, 'remediation_task', $3, 'update', $4, $5)`,
      [workspaceId, req.user.id, id, JSON.stringify(existing.rows[0]), JSON.stringify(updates)],
    );

    return reply.send({ updated: true });
  });

  // GET /api/audit
  app.get('/api/audit', { preHandler: [authenticate] }, async (req, reply) => {
    const { page = '1', limit = '50' } = req.query as { page?: string; limit?: string };
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await db.query(
      'SELECT * FROM audit_log WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.workspace_id, parseInt(limit), offset],
    );
    return reply.send({ logs: result.rows });
  });
}
