import { logStream } from '../services/logStream.js';

// This function will be called by pino.transport
export default function websocketTransport() {
  return {
    write(chunk: string) {
      logStream.broadcast(chunk);
    },
  };
}
