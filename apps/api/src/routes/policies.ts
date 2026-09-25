import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { extractPolicyControls } from '../services/ai.service.js';
import { authenticate } from '../middleware/auth.js';

export default async function policiesRoutes(app: FastifyInstance) {
  // GET /api/policies
  app.get('/api/policies', { preHandler: [authenticate] }, async (req, reply) => {
    const result = await db.query(
      'SELECT * FROM policies WHERE workspace_id = $1 ORDER BY uploaded_at DESC',
      [req.user.workspace_id],
    );
    return reply.send({ policies: result.rows });
  });

  // POST /api/policies/upload — multipart PDF upload
  app.post('/api/policies/upload', { preHandler: [authenticate] }, async (req, reply) => {
    const workspaceId = req.user.workspace_id;

    // Check 5-file limit
    const countResult = await db.query(
      "SELECT COUNT(*) FROM policies WHERE workspace_id = $1 AND index_status != 'error'",
      [workspaceId],
    );
    if (parseInt(countResult.rows[0].count) >= 5) {
      return reply.status(400).send({ error: 'Maximum 5 policy documents allowed per workspace' });
    }

    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });
    if (!data.mimetype.includes('pdf') && !data.filename.endsWith('.pdf')) {
      return reply.status(400).send({ error: 'Only PDF files are supported' });
    }

    // Read file content
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const fileBuffer = Buffer.concat(chunks);
    const fileSizeBytes = fileBuffer.length;

    if (fileSizeBytes > 25 * 1024 * 1024) {
      return reply.status(400).send({ error: 'File size must be under 25MB' });
    }

    // Store policy record
    const storagePath = `policies/${workspaceId}/${Date.now()}-${data.filename}`;
    const policyResult = await db.query(
      `INSERT INTO policies (workspace_id, filename, storage_path, file_size_bytes, index_status, uploaded_by)
       VALUES ($1, $2, $3, $4, 'indexing', $5) RETURNING *`,
      [workspaceId, data.filename, storagePath, fileSizeBytes, req.user.id],
    );
    const policy = policyResult.rows[0];

    // Extract text from PDF (basic extraction - in production use a PDF library)
    const policyText = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 50000));

    // Process in background (non-blocking response)
    setImmediate(async () => {
      try {
        const controls = await extractPolicyControls(policyText);

        for (const control of controls) {
          await db.query(
            `INSERT INTO policy_controls (policy_id, workspace_id, control_text, control_category, page_number)
             VALUES ($1, $2, $3, $4, $5)`,
            [policy.id, workspaceId, control.control_text, control.control_category, control.page_number],
          );
        }

        await db.query(
          "UPDATE policies SET index_status = 'indexed', control_count = $1 WHERE id = $2",
          [controls.length, policy.id],
        );

        await db.query(
          `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, after_state)
           VALUES ($1, $2, 'policy', $3, 'indexed', $4)`,
          [workspaceId, req.user.id, policy.id, JSON.stringify({ control_count: controls.length })],
        );
      } catch (error) {
        app.log.error(error, 'Policy indexing failed');
        await db.query("UPDATE policies SET index_status = 'error' WHERE id = $1", [policy.id]);
      }
    });

    // Audit log
    await db.query(
      `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, after_state)
       VALUES ($1, $2, 'policy', $3, 'upload', $4)`,
      [workspaceId, req.user.id, policy.id, JSON.stringify({ filename: data.filename })],
    );

    return reply.status(201).send({ policy });
  });

  // GET /api/policies/:id
  app.get('/api/policies/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await db.query(
      'SELECT * FROM policies WHERE id = $1 AND workspace_id = $2',
      [id, req.user.workspace_id],
    );
    if (!result.rows[0]) return reply.status(404).send({ error: 'Policy not found' });

    const controls = await db.query(
      'SELECT * FROM policy_controls WHERE policy_id = $1 ORDER BY page_number, extracted_at',
      [id],
    );

    return reply.send({ policy: result.rows[0], controls: controls.rows });
  });

  // DELETE /api/policies/:id
  app.delete('/api/policies/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await db.query(
      'SELECT id FROM policies WHERE id = $1 AND workspace_id = $2',
      [id, req.user.workspace_id],
    );
    if (!result.rows[0]) return reply.status(404).send({ error: 'Policy not found' });

    await db.query('DELETE FROM policy_controls WHERE policy_id = $1', [id]);
    await db.query('DELETE FROM policies WHERE id = $1', [id]);

    await db.query(
      `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action)
       VALUES ($1, $2, 'policy', $3, 'delete')`,
      [req.user.workspace_id, req.user.id, id],
    );

    return reply.send({ deleted: true });
  });
}
