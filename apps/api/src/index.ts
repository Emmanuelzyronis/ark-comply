import 'dotenv/config';
import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { authPlugin } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import gapsRoutes from './routes/gaps.js';
import policiesRoutes from './routes/policies.js';
import dashboardRoutes from './routes/dashboard.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const IS_DEV = process.env.NODE_ENV !== 'production';

const fastify = Fastify({
  logger: {
    level: IS_DEV ? 'info' : 'warn',
    ...(IS_DEV ? {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    } : {}),
  },
  bodyLimit: 25 * 1024 * 1024,
});

async function start(): Promise<void> {
  await fastify.register(cors, {
    origin: IS_DEV ? true : (process.env.CORS_ORIGIN ?? false),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: { fileSize: 25 * 1024 * 1024, files: 5 },
  });

  await fastify.register(authPlugin);

  await fastify.register(authRoutes);
  await fastify.register(gapsRoutes);
  await fastify.register(policiesRoutes);
  await fastify.register(dashboardRoutes);

  fastify.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'arkcomply-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    request.log.error({ err: error, path: request.url }, 'Unhandled error');
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      ...(IS_DEV && statusCode >= 500 ? { stack: error.stack } : {}),
    });
  });

  fastify.setNotFoundHandler((_req, reply) => reply.status(404).send({ error: 'Not Found' }));

  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`ArkComply API listening on ${HOST}:${PORT}`);
}

async function shutdown(signal: string): Promise<void> {
  fastify.log.info(`${signal} received — shutting down`);
  await fastify.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
