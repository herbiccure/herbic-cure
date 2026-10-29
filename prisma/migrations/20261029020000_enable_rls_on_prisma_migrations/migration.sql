-- Enable Row Level Security (RLS) on _prisma_migrations table
-- Resolves Supabase Database Linter: "RLS Disabled in Public" for public._prisma_migrations
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Revoke read/write access from anon and authenticated PostgREST roles
REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;

