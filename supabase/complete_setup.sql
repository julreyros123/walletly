-- ==============================================================================
-- CBUDGET / WALLETLY — COMPLETE & UNIFIED SUPABASE SETUP SCRIPT
-- ==============================================================================
-- Run this script once in your Supabase SQL Editor.
-- It creates or upgrades ALL tables, sets up Row-Level Security (RLS), triggers,
-- indexes, and permissions. Safe to re-run multiple times (idempotent).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES TABLE (public.profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    age INTEGER,
    is_onboarded BOOLEAN DEFAULT FALSE,
    phone TEXT,
    city TEXT,
    school_grade TEXT,
    avatar_url TEXT,
    avatar_color TEXT DEFAULT '#10B981',
    avatar_emoji TEXT DEFAULT '💼',
    guardian_email TEXT,
    guardian_linked BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist in case table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_grade TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#10B981';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '💼';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_linked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_premium;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- ==============================================================================
-- 3. USER APP STATE BACKUP (public.user_app_state)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_app_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own app state" ON public.user_app_state;
CREATE POLICY "Users can manage their own app state" ON public.user_app_state FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. BUDGETS TABLE (public.budgets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT DEFAULT '__total__',
    allocated_amount NUMERIC(12, 2) DEFAULT 0.00,
    spent_amount NUMERIC(12, 2) DEFAULT 0.00,
    month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id TEXT,
    category_id TEXT,
    limit_amount NUMERIC(12, 2),
    period TEXT
);

ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '__total__';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS allocated_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS limit_amount NUMERIC(12, 2);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS period TEXT;

DO $$ BEGIN
    ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_category_month_key UNIQUE (user_id, category, month);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets" ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets (user_id, month);

-- ==============================================================================
-- 5. TRANSACTIONS TABLE (public.transactions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id TEXT,
    category_id TEXT,
    date DATE
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date DATE;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, transaction_date DESC);

-- ==============================================================================
-- 6. SAVING CHALLENGES / GOALS TABLE (public.saving_challenges)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saving_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Savings Goal',
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    end_date DATE,
    icon TEXT DEFAULT 'PiggyBank',
    color TEXT DEFAULT '#10B981',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS challenge_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Savings Goal';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS target_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS current_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'PiggyBank';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10B981';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.saving_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own saving challenges" ON public.saving_challenges;
CREATE POLICY "Users can manage their own saving challenges" ON public.saving_challenges FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saving_challenges_user ON public.saving_challenges (user_id);

-- Backward-compatible VIEW for savings_goals
CREATE OR REPLACE VIEW public.savings_goals AS
SELECT
    challenge_id AS id,
    challenge_id,
    user_id,
    COALESCE(title, 'Savings Goal') AS title,
    target_amount,
    current_amount,
    end_date AS deadline,
    end_date,
    COALESCE(icon, 'PiggyBank') AS icon,
    COALESCE(color, '#10B981') AS color,
    is_completed,
    created_at,
    updated_at
FROM public.saving_challenges;

-- ==============================================================================
-- 7. SIMULATED INVESTMENTS TABLE (public.user_investments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'crypto', 'bond')),
    quantity NUMERIC(16, 6) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (average_buy_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.user_investments ADD CONSTRAINT user_investments_user_ticker_key UNIQUE (user_id, ticker);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own simulated investments" ON public.user_investments;
CREATE POLICY "Users can manage their own simulated investments" ON public.user_investments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_investments_user ON public.user_investments (user_id);

-- ==============================================================================
-- 8. GUARDIAN REPORTS TABLE (public.guardian_reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guardian_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_email TEXT NOT NULL,
    financial_health_score INTEGER NOT NULL DEFAULT 85,
    streak_days INTEGER NOT NULL DEFAULT 1,
    badges_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guardian_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their guardian reports" ON public.guardian_reports;
CREATE POLICY "Users can manage their guardian reports" ON public.guardian_reports FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_guardian_reports_user ON public.guardian_reports (user_id);

-- ==============================================================================
-- 9. AUTH TRIGGER (Auto-create profile when user signs up)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user@app'), '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(public.profiles.name, EXCLUDED.name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. USER COMPLETED LESSONS TABLE (public.user_lessons)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.user_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own completed lessons" ON public.user_lessons;
CREATE POLICY "Users can manage their own completed lessons" ON public.user_lessons FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_lessons_user ON public.user_lessons (user_id);

-- ==============================================================================
-- 10. ACCOUNT DELETION FUNCTION (GDPR / Right-to-be-forgotten)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    calling_user_id UUID;
BEGIN
    calling_user_id := auth.uid();
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    DELETE FROM auth.users WHERE id = calling_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated, service_role;

-- ==============================================================================
-- 11. GRANT PERMISSIONS TO AUTHENTICATED & SERVICE ROLE
-- ==============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
