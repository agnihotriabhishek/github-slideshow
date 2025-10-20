# VoxAssist Acceptance Criteria & Testing Matrix (MVP)

## Functional
- Telephony connect (Twilio)
  - Given valid credentials and number, when calling POST /api/telephony/connect, then status becomes `connected` and number appears in GET /api/telephony/numbers.
  - Negative: invalid credentials -> 401/422, status `failed`.

- Inbound call handling
  - Given a connected number, when an inbound call arrives, then a call record is created, recording starts, and WebSocket emits `call.started` within 300ms of media start.
  - WebSocket emits `transcript.partial` during caller speech with seq ordering and confidence fields.
  - Barge-in: when caller speaks during TTS playback, current TTS is interrupted within 150ms.

- Outbound dialing
  - When POST /api/call/outbound, then a call is initiated, `call.started` is emitted, and media established.
  - Idempotency: repeated request with same Idempotency-Key does not create duplicate call.

- Transcripts & Notes
  - Transcript segments persist with strict `seq` ordering; final segments marked `isFinal=true`.
  - Notes upsert saves text and suggested actions; GET returns latest.

- Tasks
  - Creating one or multiple tasks returns created entities with correct linkage to call.

## Performance
- TTS first chunk TTFB median < 150ms (in-region), 95th < 400ms.
- Transcript finalization median < 3s after utterance end.
- WebSocket ping/pong latency < 100ms in-region.

## Reliability
- Call drop rate < 1% over 10k calls in staging load test.
- Automatic retry for transient 5xx from TTS/STT with exponential backoff.

## Security
- All endpoints require JWT; RBAC enforced for notes/tasks.
- PII redaction in logs; phone numbers masked except last 4.
- Recordings encrypted at rest (SSE-S3) and served via signed URLs.

## Observability
- Metrics exported: call rate, TTS TTFB, STT WER, error rates, cost/minute.
- Tracing spans across telephony -> orchestration -> adapters -> providers.

## Testing Matrix
| Area | Test | Type | Pass Criteria |
|---|---|---|---|
| Telephony Connect | Valid Twilio credentials | Integration | Number status=connected |
| Telephony Connect | Invalid credentials | Integration | 401/422, status=failed |
| Inbound | call.started emission | Integration | Event within 300ms |
| Realtime | transcript.partial ordering | Integration | seq strictly increasing |
| Realtime | barge-in | Integration | TTS stops <150ms |
| Outbound | Idempotency | Integration | Single call per key |
| Storage | Recording upload | Integration | S3 object exists, ACL correct |
| Transcripts | Finalization | Integration | isFinal=true segments persisted |
| Notes | Upsert | API | Returns updated notes |
| Tasks | Batch create | API | Returns array, linked to call |
| Perf | TTS TTFB | Load | p50<150ms, p95<400ms |
| Perf | Transcript delay | Load | p50<3s |
| Security | JWT required | Security | 401 without token |
| Security | RBAC | Security | Forbidden for unauthorized roles |
