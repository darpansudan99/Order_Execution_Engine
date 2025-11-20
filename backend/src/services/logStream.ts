import { WebSocket } from 'ws';

class LogStream {
  private clients: Set<WebSocket>;

  constructor() {
    this.clients = new Set();
  }

  add(client: WebSocket) {
    this.clients.add(client);
  }

  remove(client: WebSocket) {
    this.clients.delete(client);
  }

  broadcast(message: string) {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

export const logStream = new LogStream();
