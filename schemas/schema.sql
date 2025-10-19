-- VoxAssist relational schema (PostgreSQL)
-- Enable UUID generation (requires pgcrypto extension in many managed Postgres services)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenancy
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent persona configuration per account
CREATE TABLE IF NOT EXISTS agent_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tts_voice_id TEXT NOT NULL,
  script_templates JSONB NOT NULL DEFAULT '{}',
  fallback_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_personas_account ON agent_personas(account_id);

-- Connected numbers per account
CREATE TABLE IF NOT EXISTS connected_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('twilio','plivo','telnyx','sip')),
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('connected','pending','failed')),
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_connected_number ON connected_numbers(account_id, phone_number);

-- Calls
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('twilio','plivo','telnyx','sip')),
  external_call_id TEXT,
  agent_persona_id UUID REFERENCES agent_personas(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_sec INTEGER,
  cost NUMERIC(12,6),
  recording_url TEXT,
  transcript_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_calls_account_time ON calls(account_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_transcript ON calls(transcript_id);

-- Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_transcripts_call ON transcripts(call_id);

-- Transcript segments (streaming, ordered by seq)
CREATE TABLE IF NOT EXISTS transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('caller','agent','human')),
  text TEXT NOT NULL,
  confidence NUMERIC(5,4),
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_transcript_seg_call_seq ON transcript_segments(call_id, seq);
CREATE INDEX IF NOT EXISTS idx_transcript_seg_call ON transcript_segments(call_id);

-- Notes per call
CREATE TABLE IF NOT EXISTS call_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  suggested_actions JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_call_notes_call ON call_notes(call_id);

-- Tasks derived from calls
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_call ON tasks(call_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Billing records per call
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  provider_cost NUMERIC(12,6) NOT NULL DEFAULT 0,
  markup NUMERIC(12,6) NOT NULL DEFAULT 0,
  invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_call ON billing_records(call_id);

-- Optional: enforce calls.transcript_id references transcripts.id
ALTER TABLE calls
  ADD CONSTRAINT fk_calls_transcript
  FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
  ON DELETE SET NULL;
