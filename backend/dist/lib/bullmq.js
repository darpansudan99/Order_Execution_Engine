import { Queue, Worker } from 'bullmq';
import redis from './redis.js';
import { dexRouter } from '../services/router.js';
import sql from '../db/index.js';
const publisher = redis.duplicate();
export const orderQueue = new Queue('order-queue', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});
const worker = new Worker('order-queue', async (job) => {
    const { orderId, tokenIn, tokenOut, amount } = job.data;
    console.log(`Processing job ${job.id} with data:`, job.data);
    const publishStatus = async (status, data) => {
        const message = JSON.stringify({ orderId, status, ...data });
        await publisher.publish(orderId, message);
        await sql `
        UPDATE orders
        SET status = ${status}, "amountOut" = ${data?.executedPrice}, "txHash" = ${data?.txHash}, error = ${data?.error}
        WHERE "orderId" = ${orderId}
      `;
    };
    try {
        await sql `
        INSERT INTO orders ("orderId", "tokenIn", "tokenOut", "amountIn", status)
        VALUES (${orderId}, ${tokenIn}, ${tokenOut}, ${amount}, 'pending')
      `;
        await publishStatus('routing');
        const { dex, quote } = await dexRouter.findBestRoute(tokenIn, tokenOut, amount);
        await publishStatus('building');
        const order = { ...job.data, price: quote.price };
        console.log(`Order object before executeSwap:`, order); // ADDED LOG
        await publishStatus('submitted');
        const { txHash, executedPrice } = await dex.executeSwap(order);
        console.log(`Result from executeSwap - txHash: ${txHash}, executedPrice: ${executedPrice}`); // ADDED LOG
        await publishStatus('confirmed', { txHash, executedPrice });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await publishStatus('failed', { error: errorMessage });
        throw error;
    }
    return { done: true };
}, { connection: redis, concurrency: 10 });
worker.on('completed', (job) => {
    console.log(`${job.id} has completed!`);
});
worker.on('failed', (job, err) => {
    console.log(`${job?.id ?? 'unknown'} has failed with ${err.message}`);
});
