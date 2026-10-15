-- ==============================================================================
-- CBUDGET / WALLETLY — DATABASE UPGRADE & HARMONIZATION MIGRATION
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to safely upgrade an existing database.
-- It resolves:
-- 1. Dual ownership (standardizes on user_id UUID with backward-compatible triggers).
-- 2. Category & amount compatibility (text category names, allocated_amount, transaction_date).
-- 3. Financial data integrity (CHECK constraints for positive amounts, unique budget constraint).
-- 4. Hardened account deletion function (delete_user with fixed search_path & least privilege).
-- 5. Removal of legacy is_premium column.
-- 6. Student data privacy and strict RLS policies (zero anon access).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. PROFILES UPGRADE & PRIVACY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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

-- Drop legacy is_premium column if it still exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_premium;

-- Profiles RLS hardening
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ==============================================================================
-- 3. BUDGETS UPGRADE & DEDUPLICATION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT DEFAULT '__total__',
    allocated_amount NUMERIC(12, 2) DEFAULT 0.00,
    month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '__total__';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category_id TEXT DEFAULT '__total__';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS allocated_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS limit_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS period TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');

-- Ensure category_id is text-compatible and nullable
DO $$ BEGIN
    ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;
    ALTER TABLE public.budgets ALTER COLUMN category_id DROP NOT NULL;
    ALTER TABLE public.budgets ALTER COLUMN category_id TYPE TEXT USING category_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill user_id from owner_id
UPDATE public.budgets
SET user_id = owner_id::uuid
WHERE user_id IS NULL
  AND owner_id IS NOT NULL
  AND owner_id ~ '^[0-9a-fA-F-]{36}$';

UPDATE public.budgets
SET owner_id = user_id::text
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Backfill category and amounts
UPDATE public.budgets
SET category = COALESCE(NULLIF(category, ''), NULLIF(category_id, ''), '__total__')
WHERE category IS NULL OR category = '';

UPDATE public.budgets
SET category_id = category
WHERE category_id IS NULL OR category_id = '';

UPDATE public.budgets
SET allocated_amount = COALESCE(allocated_amount, limit_amount, 0.00)
WHERE allocated_amount IS NULL OR (allocated_amount = 0 AND limit_amount > 0);

UPDATE public.budgets
SET limit_amount = allocated_amount
WHERE limit_amount IS NULL OR (limit_amount = 0 AND allocated_amount > 0);

UPDATE public.budgets
SET month = COALESCE(NULLIF(month, ''), NULLIF(period, ''), to_char(CURRENT_DATE, 'YYYY-MM'))
WHERE month IS NULL OR month = '';

UPDATE public.budgets
SET period = month
WHERE period IS NULL OR period = '';

-- Fix any negative numbers
UPDATE public.budgets SET allocated_amount = 0.00 WHERE allocated_amount < 0;
UPDATE public.budgets SET spent_amount = 0.00 WHERE spent_amount < 0;
UPDATE public.budgets SET limit_amount = 0.00 WHERE limit_amount < 0;

-- Deduplicate existing duplicate budgets per (user_id, category, month) keeping the most recent
DELETE FROM public.budgets a
WHERE a.budget_id IN (
    SELECT budget_id FROM (
        SELECT budget_id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, category, month
                   ORDER BY updated_at DESC, created_at DESC
               ) AS rnum
        FROM public.budgets
        WHERE user_id IS NOT NULL
    ) t
    WHERE t.rnum > 1
);

-- Delete orphaned rows without user_id
DELETE FROM public.budgets WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint on (user_id, category, month)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_user_category_month_key') THEN
        ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_category_month_key UNIQUE (user_id, category, month);
    END IF;
END $$;

-- Add check constraints for amounts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_allocated_amount_check') THEN
        ALTER TABLE public.budgets ADD CONSTRAINT budgets_allocated_amount_check CHECK (allocated_amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_spent_amount_check') THEN
        ALTER TABLE public.budgets ADD CONSTRAINT budgets_spent_amount_check CHECK (spent_amount >= 0);
    END IF;
END $$;

-- Install bidirectional sync trigger
CREATE OR REPLACE FUNCTION public.sync_budget_canonical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.owner_id ~ '^[0-9a-fA-F-]{36}$' THEN
        NEW.user_id := NEW.owner_id::uuid;
    END IF;
    NEW.owner_id := NEW.user_id::text;
    NEW.category := COALESCE(NULLIF(NEW.category, ''), NULLIF(NEW.category_id, ''), '__total__');
    NEW.category_id := NEW.category;
    NEW.allocated_amount := COALESCE(NEW.allocated_amount, NEW.limit_amount, 0.00);
    NEW.limit_amount := NEW.allocated_amount;
    NEW.month := COALESCE(NULLIF(NEW.month, ''), NULLIF(NEW.period, ''), to_char(CURRENT_DATE, 'YYYY-MM'));
    NEW.period := NEW.month;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_budget_canonical_fields ON public.budgets;
CREATE TRIGGER trg_sync_budget_canonical_fields
    BEFORE INSERT OR UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_canonical_fields();

-- Budgets RLS hardening
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can manage their own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets (user_id, month);

-- ==============================================================================
-- 4. TRANSACTIONS UPGRADE & INTEGRITY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'expense',
    category TEXT DEFAULT 'Other',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id TEXT DEFAULT 'Other';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Ensure category_id is nullable text
DO $$ BEGIN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;
    ALTER TABLE public.transactions ALTER COLUMN category_id DROP NOT NULL;
    ALTER TABLE public.transactions ALTER COLUMN category_id TYPE TEXT USING category_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill user_id from owner_id
UPDATE public.transactions
SET user_id = owner_id::uuid
WHERE user_id IS NULL
  AND owner_id IS NOT NULL
  AND owner_id ~ '^[0-9a-fA-F-]{36}$';

UPDATE public.transactions
SET owner_id = user_id::text
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Backfill category and dates
UPDATE public.transactions
SET category = COALESCE(NULLIF(category, ''), NULLIF(category_id, ''), 'Other')
WHERE category IS NULL OR category = '';

UPDATE public.transactions
SET category_id = category
WHERE category_id IS NULL OR category_id = '';

UPDATE public.transactions
SET transaction_date = COALESCE(transaction_date, date, CURRENT_DATE)
WHERE transaction_date IS NULL;

UPDATE public.transactions
SET date = transaction_date
WHERE date IS NULL;

-- Clean up invalid amounts before check constraint
UPDATE public.transactions SET amount = ABS(amount) WHERE amount < 0;
DELETE FROM public.transactions WHERE amount = 0;
DELETE FROM public.transactions WHERE user_id IS NULL;

-- Ensure user_id NOT NULL
ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;

-- Add type and amount check constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_type_check') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_check') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_check CHECK (amount > 0);
    END IF;
END $$;

-- Install bidirectional sync trigger
CREATE OR REPLACE FUNCTION public.sync_transaction_canonical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.owner_id ~ '^[0-9a-fA-F-]{36}$' THEN
        NEW.user_id := NEW.owner_id::uuid;
    END IF;
    NEW.owner_id := NEW.user_id::text;
    NEW.category := COALESCE(NULLIF(NEW.category, ''), NULLIF(NEW.category_id, ''), 'Other');
    NEW.category_id := NEW.category;
    NEW.transaction_date := COALESCE(NEW.transaction_date, NEW.date, CURRENT_DATE);
    NEW.date := NEW.transaction_date;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_transaction_canonical_fields ON public.transactions;
CREATE TRIGGER trg_sync_transaction_canonical_fields
    BEFORE INSERT OR UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_transaction_canonical_fields();

-- Transactions RLS hardening
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can manage their own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, transaction_date DESC);

-- ==============================================================================
-- 5. SAVING CHALLENGES UPGRADE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saving_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Savings Goal';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'PiggyBank';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10B981';

-- Check constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saving_challenges_target_amount_check') THEN
        ALTER TABLE public.saving_challenges ADD CONSTRAINT saving_challenges_target_amount_check CHECK (target_amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saving_challenges_current_amount_check') THEN
        ALTER TABLE public.saving_challenges ADD CONSTRAINT saving_challenges_current_amount_check CHECK (current_amount >= 0);
    END IF;
END $$;

ALTER TABLE public.saving_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own saving challenges" ON public.saving_challenges;

CREATE POLICY "Users can manage their own saving challenges"
    ON public.saving_challenges FOR ALL
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
-- 6. SIMULATED INVESTMENTS UPGRADE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'crypto', 'bond')),
    quantity NUMERIC(16, 6) NOT NULL DEFAULT 0,
    average_buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_investments_user_ticker_key') THEN
        ALTER TABLE public.user_investments ADD CONSTRAINT user_investments_user_ticker_key UNIQUE (user_id, ticker);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_investments_quantity_check') THEN
        ALTER TABLE public.user_investments ADD CONSTRAINT user_investments_quantity_check CHECK (quantity >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_investments_average_buy_price_check') THEN
        ALTER TABLE public.user_investments ADD CONSTRAINT user_investments_average_buy_price_check CHECK (average_buy_price >= 0);
    END IF;
END $$;

ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own simulated investments" ON public.user_investments;

CREATE POLICY "Users can manage their own simulated investments"
    ON public.user_investments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_investments_user ON public.user_investments (user_id);

-- ==============================================================================
-- 7. GUARDIAN REPORTS UPGRADE (Student Data Privacy)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guardian_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_email TEXT NOT NULL,
    financial_health_score INTEGER NOT NULL,
    streak_days INTEGER NOT NULL,
    badges_count INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_reports_health_score_check') THEN
        ALTER TABLE public.guardian_reports ADD CONSTRAINT guardian_reports_health_score_check CHECK (financial_health_score >= 0 AND financial_health_score <= 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_reports_streak_days_check') THEN
        ALTER TABLE public.guardian_reports ADD CONSTRAINT guardian_reports_streak_days_check CHECK (streak_days >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guardian_reports_badges_count_check') THEN
        ALTER TABLE public.guardian_reports ADD CONSTRAINT guardian_reports_badges_count_check CHECK (badges_count >= 0);
    END IF;
END $$;

ALTER TABLE public.guardian_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and record their guardian reports" ON public.guardian_reports;

CREATE POLICY "Users can view and record their guardian reports"
    ON public.guardian_reports FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_guardian_reports_user ON public.guardian_reports (user_id);

-- ==============================================================================
-- 8. USER APP STATE UPGRADE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_app_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own app state" ON public.user_app_state;

CREATE POLICY "Users can manage their own app state"
    ON public.user_app_state FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 9. HARDENED DELETE_USER RPC (Fixed search_path and least privilege)
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

    -- auth.users ON DELETE CASCADE automatically purges profiles, budgets, transactions,
    -- saving_challenges, user_investments, guardian_reports, and user_app_state.
    DELETE FROM auth.users WHERE id = calling_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated, service_role;

-- ==============================================================================
-- 10. LEAST-PRIVILEGE ROLE PERMISSIONS (Zero anon access to private user tables)
-- ==============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
