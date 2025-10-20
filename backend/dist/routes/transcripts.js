import { Router } from 'express';
export const transcriptsRouter = Router();
transcriptsRouter.get('/:callId/transcript', (req, res) => {
    const { callId } = req.params;
    res.json({
        id: '11111111-1111-1111-1111-111111111111',
        callId,
        language: 'en',
        segments: [
            { id: 'seg1', seq: 1, startMs: 0, endMs: 1200, speaker: 'caller', text: 'Hello there', confidence: 0.92, isFinal: true },
        ],
    });
});
