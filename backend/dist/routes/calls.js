import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
export const callsRouter = Router();
callsRouter.post('/outbound', (req, res) => {
    const id = uuidv4();
    res.status(201)
        .setHeader('Location', `/api/call/${id}`)
        .json({
        id,
        accountId: '00000000-0000-0000-0000-000000000000',
        number: req.body?.to ?? '+10000000000',
        direction: 'outbound',
        provider: 'twilio',
        externalCallId: 'TWILIO-XXXX',
        agentPersonaId: req.body?.agentPersonaId ?? null,
        startTime: new Date().toISOString(),
        endTime: null,
        durationSec: null,
        cost: null,
        recordingUrl: null,
        transcriptId: null,
        status: 'open',
        tags: [],
        metadata: {},
    });
});
callsRouter.post('/:callId/transfer', (req, res) => {
    const { callId } = req.params;
    res.status(202).json({ id: callId, status: 'open', transfer: { target: req.body?.target, warmTransfer: !!req.body?.warmTransfer } });
});
callsRouter.get('/:callId', (req, res) => {
    const { callId } = req.params;
    res.json({ id: callId, status: 'open', provider: 'twilio' });
});
