import { Router } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ code: 'bad_request', message: 'email and password required' });
  }
  // Stub auth; replace with real user store
  const accessToken = jwt.sign({ sub: email, roles: ['admin'] }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: email, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ accessToken, refreshToken, expiresIn: 900 });
});

authRouter.post('/refresh', (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    return res.status(400).json({ code: 'bad_request', message: 'refreshToken required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    if (decoded.type !== 'refresh') throw new Error('invalid');
    const accessToken = jwt.sign({ sub: decoded.sub, roles: ['admin'] }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken, refreshToken, expiresIn: 900 });
  } catch (e) {
    res.status(401).json({ code: 'unauthorized', message: 'invalid refresh token' });
  }
});
