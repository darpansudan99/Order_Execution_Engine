import React, { useState, useEffect } from 'react';

// Define types for better readability and type safety
interface Order {
  orderId: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  status: string; // e.g., pending, routing, submitted, confirmed, failed
  txHash?: string;
  error?: string;
  ws?: WebSocket; // Store WebSocket instance for each order
}

export function Dashboard() {
  const [tokenIn, setTokenIn] = useState('SOL');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [amount, setAmount] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to handle order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch('http://localhost:3000/api/orders/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIn, tokenOut, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit order');
      }

      const data: { orderId: string } = await response.json();
      const newOrderId = data.orderId;

      const newOrder: Order = {
        orderId: newOrderId,
        tokenIn,
        tokenOut,
        amount,
        status: 'pending',
      };

      setOrders((prevOrders) => {
        // Initialize WebSocket for the new order
        const orderWs = new WebSocket(`ws://localhost:3000/api/orders/status/${newOrderId}`);
        orderWs.onmessage = (event) => {
          const statusUpdate = JSON.parse(event.data);
          setOrders((currentOrders) =>
            currentOrders.map((order) =>
              order.orderId === statusUpdate.orderId
                ? {
                    ...order,
                    status: statusUpdate.status,
                    txHash: statusUpdate.txHash,
                    error: statusUpdate.error,
                  }
                : order
            )
          );
        };
        orderWs.onclose = () => console.log(`WS for order ${newOrderId} closed`);
        orderWs.onerror = (err) => console.error(`WS error for order ${newOrderId}:`, err);

        return [...prevOrders, { ...newOrder, ws: orderWs }];
      });
    } catch (error: any) {
      setSubmitError(error.message || 'An unexpected error occurred.');
      console.error('Order submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clean up WebSockets when the component unmounts
  useEffect(() => {
    return () => {
      orders.forEach((order) => {
        if (order.ws && order.ws.readyState === WebSocket.OPEN) {
          order.ws.close();
        }
      });
    };
  }, [orders]); // Re-run if orders array itself changes, to clean up old WS connections

  return (
    <div style={{ padding: '20px' }}>
      <h2>Submit New Order</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label htmlFor="tokenIn" style={{ marginRight: '10px' }}>Token In:</label>
          <input
            type="text"
            id="tokenIn"
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            disabled={loading}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label htmlFor="tokenOut" style={{ marginRight: '10px' }}>Token Out:</label>
          <input
            type="text"
            id="tokenOut"
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
            disabled={loading}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label htmlFor="amount" style={{ marginRight: '10px' }}>Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            disabled={loading}
            min="0.000001"
            step="0.000001"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}>
          {loading ? 'Submitting...' : 'Execute Order'}
        </button>
        {submitError && <p style={{ color: 'red' }}>Error: {submitError}</p>}
      </form>

      <h2>Active Orders</h2>
      {orders.length === 0 ? (
        <p>No orders submitted yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {orders.map((order) => (
            <div key={order.orderId} style={{
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#61dafb' }}>Order ID: {order.orderId.substring(0, 8)}...</h3>
              <p><strong>IN:</strong> {order.amount} {order.tokenIn}</p>
              <p><strong>OUT:</strong> {order.tokenOut}</p>
              <p><strong>Status:</strong> <span style={{ color:
                order.status === 'confirmed' ? 'lightgreen' :
                order.status === 'failed' ? 'red' :
                'orange'
              }}>{order.status}</span></p>
              {order.txHash && <p><strong>Tx Hash:</strong> {order.txHash.substring(0, 10)}...</p>}
              {order.error && <p style={{ color: 'red' }}><strong>Error:</strong> {order.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}