-- ==============================================================================
-- CBUDGET / WALLETLY — AUTHORITATIVE BACKEND DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Architecture: Backend-as-a-Service (BaaS) via Supabase
-- Database: PostgreSQL 15+ with strict Row-Level Security (RLS) on all tables
-- Ownership: Standardized on user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
-- Categories: Standardized on human-readable TEXT category names
-- Security: Least-privilege role permissions, secure search_path on functions, zero anon access
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES TABLE (Linked directly to Supabase Auth auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    age INTEGER CHECK (age IS NULL OR (age >= 5 AND age <= 120)),
    is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
    phone TEXT,
    city TEXT,
    school_grade TEXT,
    avatar_url TEXT,
    avatar_color TEXT DEFAULT '#10B981',
    avatar_emoji TEXT DEFAULT '💼',
    guardian_email TEXT,
    guardian_linked BOOLEAN NOT NULL DEFAULT FALSE,
    push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean up any existing legacy RLS policies
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
-- 3. BUDGETS TABLE (Canonical: user_id, category, allocated_amount, month)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT '__total__',
    allocated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (spent_amount >= 0),
    month TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Backward-compatibility columns for legacy client releases
    owner_id TEXT,
    category_id TEXT,
    limit_amount NUMERIC(12, 2),
    period TEXT,
    CONSTRAINT budgets_user_category_month_key UNIQUE (user_id, category, month)
);

-- Bidirectional trigger ensuring canonical and legacy columns remain synchronized
CREATE OR REPLACE FUNCTION public.sync_budget_canonical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Standardize user ownership
    IF NEW.user_id IS NULL AND NEW.owner_id ~ '^[0-9a-fA-F-]{36}$' THEN
        NEW.user_id := NEW.owner_id::uuid;
    END IF;
    NEW.owner_id := NEW.user_id::text;

    -- Standardize category text
    NEW.category := COALESCE(NULLIF(NEW.category, ''), NULLIF(NEW.category_id, ''), '__total__');
    NEW.category_id := NEW.category;

    -- Standardize amount (allocated_amount is canonical)
    NEW.allocated_amount := COALESCE(NEW.allocated_amount, NEW.limit_amount, 0.00);
    NEW.limit_amount := NEW.allocated_amount;

    -- Standardize period/month
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
-- 4. TRANSACTIONS TABLE (Canonical: user_id, category, amount, transaction_date)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Backward-compatibility columns
    owner_id TEXT,
    category_id TEXT,
    date DATE
);

-- Bidirectional trigger ensuring canonical and legacy columns remain synchronized
CREATE OR REPLACE FUNCTION public.sync_transaction_canonical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Standardize user ownership
    IF NEW.user_id IS NULL AND NEW.owner_id ~ '^[0-9a-fA-F-]{36}$' THEN
        NEW.user_id := NEW.owner_id::uuid;
    END IF;
    NEW.owner_id := NEW.user_id::text;

    -- Standardize category text
    NEW.category := COALESCE(NULLIF(NEW.category, ''), NULLIF(NEW.category_id, ''), 'Other');
    NEW.category_id := NEW.category;

    -- Standardize date
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
-- 5. SAVING CHALLENGES / GOALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saving_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Savings Goal',
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount >= 0),
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    end_date DATE,
    icon TEXT DEFAULT 'PiggyBank',
    color TEXT DEFAULT '#10B981',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
-- 6. SIMULATED INVESTMENTS & PORTFOLIO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'crypto', 'bond')),
    quantity NUMERIC(16, 6) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (average_buy_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_investments_user_ticker_key UNIQUE (user_id, ticker)
);

ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own simulated investments" ON public.user_investments;

CREATE POLICY "Users can manage their own simulated investments"
    ON public.user_investments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_investments_user ON public.user_investments (user_id);

-- ==============================================================================
-- 7. PARENTAL / GUARDIAN LOGS (Student Data Privacy: strictly restricted to auth.uid())
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guardian_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_email TEXT NOT NULL,
    financial_health_score INTEGER NOT NULL CHECK (financial_health_score >= 0 AND financial_health_score <= 100),
    streak_days INTEGER NOT NULL CHECK (streak_days >= 0),
    badges_count INTEGER NOT NULL CHECK (badges_count >= 0),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guardian_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and record their guardian reports" ON public.guardian_reports;

CREATE POLICY "Users can view and record their guardian reports"
    ON public.guardian_reports FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_guardian_reports_user ON public.guardian_reports (user_id);

-- ==============================================================================
-- 8. FULL APP STATE BACKUP (user_app_state)
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
-- 9. AUTH TRIGGER: Auto-create profile on auth.users sign up
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
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
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
-- 10. RPC FUNCTION: Secure account deletion (GDPR compliance)
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
-- 11. LEAST-PRIVILEGE ROLE PERMISSIONS (Zero anon access to private user tables)
-- ==============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
