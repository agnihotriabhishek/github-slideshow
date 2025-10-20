import { Router } from 'express';
export const notesRouter = Router();
notesRouter.post('/:callId/notes', (req, res) => {
    const { callId } = req.params;
    const { text, suggestedActions } = req.body ?? {};
    if (!text)
        return res.status(400).json({ code: 'bad_request', message: 'text required' });
    res.json({ id: 'note1', callId, text, suggestedActions: suggestedActions ?? [], updatedAt: new Date().toISOString() });
});
