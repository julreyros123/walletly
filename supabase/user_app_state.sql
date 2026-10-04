-- ════════════════════════════════════════════════════════════════════
-- Walletly: Cloud backup of full app state + transaction sync fixes
-- Run this once in the Supabase SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════

-- 1. Full per-user app state backup (XP, level, budget type, savings vault,
--    lessons, portfolio, etc.). Restored automatically on login / new device.
CREATE TABLE IF NOT EXISTS public.user_app_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_app_state' AND policyname = 'Users can manage their own app state') THEN
        CREATE POLICY "Users can manage their own app state"
            ON public.user_app_state FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. transactions.category_id is NOT NULL (UUID in this database), but the app
--    stores the category name in the text `category` column and never sends
--    category_id. That made every expense/income insert fail and get dropped.
--    Making it nullable fixes the sync without touching existing data.
ALTER TABLE public.transactions ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Same safety for budgets (app only writes the text `category` column).
ALTER TABLE public.budgets ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category TEXT;
