import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';

const BCRYPT_ROUNDS = 12;

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' + Math.random().toString(36).substring(2, 7);
}

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/api/auth/register', async (req, reply) => {
    const { email, password, full_name, workspace_name } = req.body as {
      email: string;
      password: string;
      full_name?: string;
      workspace_name?: string;
    };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    // Create workspace
    const wsName = workspace_name || `${full_name || email.split('@')[0]}'s Workspace`;
    const wsSlug = generateSlug(wsName);
    const wsResult = await db.query(
      'INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING id',
      [wsName, wsSlug],
    );
    const workspaceId = wsResult.rows[0].id;

    // Create user
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, full_name, workspace_id, role)
       VALUES ($1, $2, $3, $4, 'admin') RETURNING id, email, full_name, workspace_id, role`,
      [email, passwordHash, full_name || null, workspaceId],
    );
    const user = userResult.rows[0];

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, workspace_id: user.workspace_id, role: user.role },
      { expiresIn: process.env.JWT_EXPIRY ?? '7d' },
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_log (workspace_id, user_id, entity_type, entity_id, action, after_state)
       VALUES ($1, $2, 'user', $3, 'register', $4)`,
      [workspaceId, user.id, user.id, JSON.stringify({ email: user.email })],
    );

    return reply.status(201).send({ token, user: { id: user.id, email: user.email, full_name: user.full_name, workspace_id: user.workspace_id, role: user.role } });
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return reply.status(400).send({ error: 'Email and password required' });

    const result = await db.query(
      'SELECT id, email, password_hash, full_name, workspace_id, role FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' });

    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, workspace_id: user.workspace_id, role: user.role },
      { expiresIn: process.env.JWT_EXPIRY ?? '7d' },
    );

    return reply.send({ token, user: { id: user.id, email: user.email, full_name: user.full_name, workspace_id: user.workspace_id, role: user.role } });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const result = await db.query(
      'SELECT id, email, full_name, workspace_id, role, created_at FROM users WHERE id = $1',
      [req.user.id],
    );
    const user = result.rows[0];
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send({ user });
  });
}
