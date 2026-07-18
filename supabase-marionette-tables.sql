-- Marionette Messages Table
CREATE TABLE IF NOT EXISTS marionette_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  text TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_marionette_messages_created_at
ON marionette_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marionette_messages_user_id
ON marionette_messages(user_id);

-- Enable Row Level Security
ALTER TABLE marionette_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read messages
CREATE POLICY "Anyone can read marionette messages"
ON marionette_messages FOR SELECT
USING (true);

-- Policy: Anyone can insert messages
CREATE POLICY "Anyone can insert marionette messages"
ON marionette_messages FOR INSERT
WITH CHECK (true);

-- Marionette Cursors Table
CREATE TABLE IF NOT EXISTS marionette_cursors (
  user_id TEXT PRIMARY KEY,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  color TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE marionette_cursors ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cursors
CREATE POLICY "Anyone can read marionette cursors"
ON marionette_cursors FOR SELECT
USING (true);

-- Policy: Anyone can insert/update their own cursor
CREATE POLICY "Anyone can upsert marionette cursors"
ON marionette_cursors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update marionette cursors"
ON marionette_cursors FOR UPDATE
USING (true);

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE marionette_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE marionette_cursors;
