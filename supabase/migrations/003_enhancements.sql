-- Affinity score on characters
ALTER TABLE characters ADD COLUMN IF NOT EXISTS affinity_score INTEGER NOT NULL DEFAULT 0;

-- User facts table (long-term user memory per character)
CREATE TABLE IF NOT EXISTS user_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_facts_character_id ON user_facts(character_id);

-- Image messages support (store image_url alongside content)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
