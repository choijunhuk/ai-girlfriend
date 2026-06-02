-- Enable RLS on all tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_summaries ENABLE ROW LEVEL SECURITY;

-- Deny all anon access (server uses service_role key which bypasses RLS)
-- These policies only apply to anon/authenticated JWT users
CREATE POLICY "deny_anon_characters" ON characters FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_conversations" ON conversations FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_messages" ON messages FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_memory_summaries" ON memory_summaries FOR ALL TO anon USING (false);
