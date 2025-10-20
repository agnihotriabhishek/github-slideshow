import { WebSocket } from 'ws';

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  // login
  const resp = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'secret' })
  });
  if (!resp.ok) {
    console.error('Login failed', resp.status);
    process.exit(1);
  }
  const { accessToken } = await resp.json();

  const wsUrl = (baseUrl.replace('http', 'ws') + `/realtime?token=${accessToken}`);
  const ws = new WebSocket(wsUrl);

  let receivedStarted = false;
  const timeoutMs = 8000;
  const timer = setTimeout(() => {
    console.error('Timed out waiting for call.started');
    ws.close();
    process.exit(1);
  }, timeoutMs);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(String(data));
      if (msg?.type === 'call.started') {
        receivedStarted = true;
        clearTimeout(timer);
        console.log('OK: received call.started');
        ws.close();
        process.exit(0);
      }
    } catch {}
  });

  ws.on('error', (err) => {
    console.error('WebSocket error', err);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
