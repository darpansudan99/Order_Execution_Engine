import React, { useState, useEffect, useRef } from 'react';

export function Terminal() {
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLPreElement>(null);

  const formatLog = (logString: string): string => {
    try {
      const jsonLog = JSON.parse(logString);
      // Pretty print JSON, keeping relevant fields first
      const { level, time, msg, ...rest } = jsonLog;
      const formattedTime = new Date(time).toLocaleTimeString();
      let formattedLog = `[${formattedTime}] [${level.toUpperCase()}] ${msg || ''}`;
      if (Object.keys(rest).length > 0) {
        formattedLog += ` ${JSON.stringify(rest, null, 2)}`;
      }
      return formattedLog;
    } catch (e) {
      // If not JSON, return as is
      return logString;
    }
  };

  useEffect(() => {
    // Connect to the WebSocket
    wsRef.current = new WebSocket('ws://localhost:3000/ws/logs');

    wsRef.current.onopen = () => {
      setLogs((prev) => [...prev, '[CONNECTED] Connected to backend log stream.']);
      console.log('Connected to backend log stream.');
    };

    wsRef.current.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    wsRef.current.onerror = (event: Event) => { // Type as Event to access properties like type
      const errorMsg = event instanceof ErrorEvent ? event.message : event.type;
      setLogs((prev) => [...prev, `[ERROR] WebSocket error: ${errorMsg}`]);
      console.error('WebSocket error event:', event); // Log the full event object for detailed inspection
    };

    wsRef.current.onclose = () => {
      setLogs((prev) => [...prev, '[DISCONNECTED] Disconnected from backend log stream.']);
      console.log('Disconnected from backend log stream.');
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    // Scroll to the bottom of the terminal whenever logs update
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]); // Re-run this effect when logs state changes

  return (
    <pre ref={terminalRef} style={{ height: '100%', overflowY: 'auto', margin: 0 }}>
      {logs.map((log, index) => (
        <div key={index}>{formatLog(log)}</div>
      ))}
    </pre>
  );
}