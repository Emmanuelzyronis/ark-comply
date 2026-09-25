import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export interface AuthUser {
  sub: string;
  id: string;
  email: string;
  workspace_id: string;
  role: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUser;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing Authorization header' });
  }
  try {
    const payload = await request.jwtVerify<AuthUser>();
    if (!payload.sub) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.user = {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email ?? '',
      workspace_id: payload.workspace_id ?? '',
      role: payload.role ?? 'analyst',
    };
  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

async function authPluginImpl(fastify: FastifyInstance): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret) fastify.log.warn('JWT_SECRET is not set');

  await fastify.register(fastifyJwt, {
    secret: secret ?? 'MISSING_SECRET',
    sign: { algorithm: 'HS256' },
    verify: { algorithms: ['HS256'] },
  });

  fastify.decorate('authenticate', authenticate);
}

export const authPlugin = fp(authPluginImpl, { name: 'arkcomply-auth', fastify: '5.x' });

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
}
