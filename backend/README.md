# Order Execution Engine

This project is an order execution engine that processes market orders with DEX routing and WebSocket status updates.

## Project Overview

The primary goal of this project is to build a robust and scalable order execution engine. This engine will be capable of handling concurrent order processing, routing orders to the most favorable DEX (Decentralized Exchange), and providing real-time status updates to the user.

### Order Type: Market Order

For this implementation, we have chosen to focus on **Market Orders**.

**Why Market Orders?**

Market orders are the most fundamental type of order, aiming for immediate execution at the current best available price. This simplicity allows us to focus on the core architecture of the engine, such as routing, concurrency, and real-time updates, without the added complexity of price tracking required for limit or sniper orders.

**Future Extension:**

The engine is designed with extensibility in mind. To support other order types like **Limit Orders** or **Sniper Orders**, we can introduce a price monitoring service. This service would track the market price of assets and trigger the execution of queued limit or sniper orders when their target prices are met. The existing order processing and routing logic can be reused, with the main change being the trigger for execution.

## Tech Stack

-   **Node.js**
-   **TypeScript**
-   **Fastify** (with WebSocket support)
-   **BullMQ** (for order queuing)
-   **Redis** (for BullMQ and active order data)
-   **PostgreSQL** (for order history)

## High-Level Architecture

1.  **Order Submission:** Users submit orders via a POST request to `/api/orders/execute`. The API validates the order, assigns a unique `orderId`, and queues it for processing. The same HTTP connection is then upgraded to a WebSocket for live status updates.
2.  **DEX Routing:** The engine fetches quotes from both Raydium and Meteora (mocked for this implementation). It compares the prices and selects the DEX that offers the best execution price.
3.  **Concurrent Processing:** A queue system, powered by BullMQ, manages a pool of workers to process up to 10 orders concurrently. This ensures that the engine can handle a high throughput of orders (up to 100 orders per minute).
4.  **Execution and Status Updates:** As the order is processed, its status is updated and broadcasted to the client via the WebSocket connection. The possible statuses are:
    -   `pending`: Order received and queued.
    -   `routing`: Comparing DEX prices.
    -   `building`: Creating the transaction.
    -   `submitted`: Transaction sent to the (mock) network.
    -   `confirmed`: Transaction successful.
    -   `failed`: If any step fails.
5.  **Error Handling and Retries:** The engine includes a retry mechanism with exponential back-off (up to 3 attempts) for failed orders. If an order consistently fails, its status is marked as `failed`, and the reason for failure is persisted for later analysis.

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   Docker and Docker Compose
-   `pnpm` (or your preferred package manager)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/order-execution-engine.git
    cd order-execution-engine
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the services:**

    This will start the PostgreSQL and Redis containers.

    ```bash
    docker-compose up -d
    ```

4.  **Run the application:**

    ```bash
    npm run dev
    ```

    The server will be running at `http://localhost:3000`.

## Deployment

For deploying this application, you can use a platform as a service (PaaS) like [Render](https://render.com/) or [Fly.io](https://fly.io/). These platforms make it easy to deploy Node.js applications and managed databases.

Here's a general outline of the steps:

1.  **Create a new web service** on your chosen platform and connect it to your GitHub repository.
2.  **Set up the environment variables** for your PostgreSQL and Redis instances. Most platforms offer managed databases as add-ons.
3.  **Set the start command** to `npm start`.
4.  **Deploy the application.**

Your application will then be available at a public URL provided by the platform.

## API

### POST /api/orders/execute

Submits an order for execution.

**Request Body:**

```json
{
    "tokenIn": "SOL",
    "tokenOut": "USDC",
    "amount": 1
}
```

**Response:**

The initial HTTP response will contain the `orderId`.

```json
{
    "orderId": "some-unique-order-id"
}
```

### GET /api/orders/status/:orderId

Establishes a WebSocket connection to stream live status updates for a specific order.

**WebSocket Messages (JSON):**

```json
{
    "orderId": "your-order-id",
    "status": "pending" | "routing" | "building" | "submitted" | "confirmed" | "failed",
    "txHash": "if_confirmed",
    "error": "if_failed"
}
```


## YouTube Video

A 1-2 minute video demonstrating the functionality of the order execution engine is required. The video should cover the following points:

1.  **Order Flow:** Briefly explain the order flow through the system and the design decisions made.
2.  **Simultaneous Orders:** Submit 3-5 orders simultaneously to showcase the concurrent processing capabilities of the engine.
3.  **WebSocket Updates:** Show the WebSocket connection receiving real-time status updates for each order (from `pending` to `confirmed`).
4.  **DEX Routing:** Display the console logs or another form of output that shows the DEX routing decisions being made for each order.
5.  **Queue Processing:** Briefly touch upon how the queue is processing the orders.

The video should be uploaded to YouTube and the public link should be included in this README.

## Database Schema

The `orders` table in the PostgreSQL database will have the following schema:

| Column      | Type      | Description                               |
| :---------- | :-------- | :---------------------------------------- |
| `id`        | `SERIAL`  | **Primary Key**                           |
| `orderId`   | `VARCHAR` | Unique identifier for the order           |
| `tokenIn`   | `VARCHAR` | The input token                           |
| `tokenOut`  | `VARCHAR` | The output token                          |
| `amountIn`  | `NUMERIC` | The amount of the input token             |
| `amountOut` | `NUMERIC` | The amount of the output token (executed) |
| `status`    | `VARCHAR` | The final status of the order             |
| `txHash`    | `VARCHAR` | The transaction hash (if successful)      |
| `error`     | `TEXT`    | The error message (if failed)             |
| `createdAt` | `TIMESTAMPTZ` | The timestamp when the order was created  |

This table will serve as a historical record of all processed orders.

## Project Structure

```
.
├── src
│   ├── api
│   │   └── routes
│   │       └── order.ts
│   ├── config
│   │   └── index.ts
│   ├── db
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── lib
│   │   ├── bullmq.ts
│   │   ├── logger.ts
│   │   └── redis.ts
│   ├── services
│   │   ├── dex
│   │   │   ├── base.ts
│   │   │   ├── meteora.ts
│   │   │   └── raydium.ts
│   │   ├── order.ts
│   │   └── websocket.ts
│   └── index.ts
├── tests
│   └── ...
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

This structure is designed to be modular and scalable, with a clear separation of concerns between the different components of the application.
