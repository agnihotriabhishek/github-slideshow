import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

import { router as apiRouter } from './routes/api.js';
import { setupRealtime } from './realtime/server.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// API routes
app.use('/api', apiRouter);

const server = http.createServer(app);

// WebSocket server (realtime)
setupRealtime(server);

server.listen(PORT, () => {
  console.log(`VoxAssist backend listening on :${PORT}`);
});
