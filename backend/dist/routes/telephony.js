import { Router } from 'express';
export const telephonyRouter = Router();
telephonyRouter.post('/connect', (req, res) => {
    const { provider, credentials, phoneNumber } = req.body ?? {};
    if (!provider || !credentials || !phoneNumber) {
        return res.status(400).json({ code: 'bad_request', message: 'provider, credentials, phoneNumber required' });
    }
    // Stub: validate and store connection
    res.status(201).json({
        id: '00000000-0000-0000-0000-000000000000',
        accountId: '00000000-0000-0000-0000-000000000000',
        provider,
        phoneNumber,
        status: 'connected',
        createdAt: new Date().toISOString(),
    });
});
telephonyRouter.get('/numbers', (_req, res) => {
    res.json([
        {
            id: '00000000-0000-0000-0000-000000000000',
            accountId: '00000000-0000-0000-0000-000000000000',
            provider: 'twilio',
            phoneNumber: '+15551234567',
            status: 'connected',
            createdAt: new Date().toISOString(),
        },
    ]);
});
