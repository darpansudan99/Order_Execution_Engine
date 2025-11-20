import sql from './index.js';
export async function createOrdersTable() {
    await sql `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      "orderId" VARCHAR(255) NOT NULL,
      "tokenIn" VARCHAR(255) NOT NULL,
      "tokenOut" VARCHAR(255) NOT NULL,
      "amountIn" NUMERIC NOT NULL,
      "amountOut" NUMERIC,
      status VARCHAR(255) NOT NULL,
      "txHash" VARCHAR(255),
      error TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;
    console.log('Table "orders" created successfully.');
}
