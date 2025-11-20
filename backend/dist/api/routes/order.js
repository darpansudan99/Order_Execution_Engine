import { randomUUID } from 'crypto';
import { orderQueue } from '../../lib/bullmq.js';
import redis from '../../lib/redis.js';
export default async function (fastify) {
    // HTTP POST for order submission
    fastify.post('/api/orders/execute', async (request, reply) => {
        const orderId = randomUUID();
        const { tokenIn, tokenOut, amount } = request.body;
        if (!tokenIn || !tokenOut || !amount) {
            reply.code(400).send({ message: 'Missing tokenIn, tokenOut, or amount' });
            return;
        }
        const orderData = { orderId, tokenIn, tokenOut, amount };
        await orderQueue.add('market-order', orderData);
        reply.send({ orderId });
    });
    // WebSocket for status updates
    fastify.get('/api/orders/status/:orderId', { websocket: true }, async (connection, req) => {
        const { orderId } = req.params;
        const subscriber = redis.duplicate();
        console.log(`WebSocket connection established for orderId: ${orderId}`);
        subscriber.subscribe(orderId, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${orderId}`, err);
                connection.close(); // Directly use connection
                return;
            }
            console.log(`Subscribed to ${orderId}`);
        });
        subscriber.on('message', (channel, message) => {
            if (channel === orderId) {
                console.log(`Sending message to client for ${orderId}: ${message}`);
                connection.send(message); // Directly use connection
                const { status } = JSON.parse(message);
                if (status === 'confirmed' || status === 'failed') {
                    connection.close(); // Directly use connection
                }
            }
        });
        connection.on('close', () => {
            console.log(`WebSocket connection closed for orderId: ${orderId}`);
            subscriber.unsubscribe(orderId);
            subscriber.quit();
        });
    });
}
