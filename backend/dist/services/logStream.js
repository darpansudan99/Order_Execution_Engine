import { WebSocket } from 'ws';
class LogStream {
    constructor() {
        this.clients = new Set();
    }
    add(client) {
        this.clients.add(client);
    }
    remove(client) {
        this.clients.delete(client);
    }
    broadcast(message) {
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }
}
export const logStream = new LogStream();
