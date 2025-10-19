import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface Envelope<T = unknown> {
  type: string;
  eventId: string;
  seq: number;
  ts: string;
  callId: string;
  payload?: T;
}

export function setupRealtime(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/realtime' });
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    // TODO: validate JWT token

    let seq = 0;
    const callId = uuidv4();

    const send = (msg: Envelope) => {
      ws.send(JSON.stringify(msg));
    };

    // Welcome ping
    send({
      type: 'call.started',
      eventId: uuidv4(),
      seq: seq++,
      ts: new Date().toISOString(),
      callId,
      payload: { from: '+10000000000', to: '+10000000001', direction: 'inbound', provider: 'twilio', externalCallId: 'TWILIO-XXX', agentPersonaId: null },
    });

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        send({ type: 'system.ping', eventId: uuidv4(), seq: seq++, ts: new Date().toISOString(), callId, payload: { nonce: uuidv4() } });
      }
    }, 15000);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data));
        if (msg?.type === 'client.ack') {
          // no-op; in real impl, track acks per connection
        }
        if (msg?.type === 'client.barge_in') {
          // broadcast barge-in ack
          send({ type: 'system.ack', eventId: uuidv4(), seq: seq++, ts: new Date().toISOString(), callId, payload: { eventId: msg.eventId ?? 'client' } });
        }
      } catch {
        // ignore
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });
}
