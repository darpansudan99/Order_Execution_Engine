import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors'; // Import cors plugin
import orderRoutes from './api/routes/order.js';
import './lib/bullmq.js';
import { createOrdersTable } from './db/schema.js';
import { logStream } from './services/logStream.js';

const fastify = Fastify({
  logger: {
    level: 'info', // Set the minimum log level to capture
    transport: {
      targets: [
        {
          level: 'info',
          target: 'pino-pretty', // For console readability
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        },
        {
          level: 'info',
          target: './transports/websocketTransport.js', // Our custom transport for WebSockets
          options: {}, // Required for target to be a module path
        },
      ],
    },
  },
});

fastify.register(cors, { origin: '*' }); // Register cors plugin with permissive origin
fastify.register(websocket);
fastify.register(orderRoutes);

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// WebSocket route for log streaming
fastify.get('/ws/logs', { websocket: true }, (connection: import('ws').WebSocket, req) => {
  fastify.log.info('Client connected to /ws/logs');
  logStream.add(connection); // Directly use connection

  connection.on('close', () => { // Directly use connection
    fastify.log.info('Client disconnected from /ws/logs');
    logStream.remove(connection); // Directly use connection
  });

  connection.on('error', (error: Event) => { // Directly use connection
    fastify.log.error(`WebSocket error on /ws/logs: ${error}`);
    logStream.remove(connection); // Directly use connection
  });
});

const start = async () => {
  try {
    await createOrdersTable();
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
