-- ==============================================================================
-- CBUDGET / WALLETLY — BACKEND DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Architecture: Backend-as-a-Service (BaaS) via Supabase
-- Database: PostgreSQL 15+ with Row-Level Security (RLS) enabled on all tables
-- Compatible with both legacy and current schema field naming conventions
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES TABLE (Linked directly to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
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
    is_premium BOOLEAN DEFAULT FALSE, -- Educational sandbox (100% free)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles column migration safety (in case table already exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_linked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_grade TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can delete their own profile') THEN
        CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
    END IF;
END $$;

-- 3. BUDGETS TABLE (Supports both owner_id/user_id and limit_amount/allocated_amount)
CREATE TABLE IF NOT EXISTS public.budgets (
    budget_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL DEFAULT '__total__',
    category TEXT DEFAULT '__total__',
    limit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    allocated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Budgets column migration safety
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS allocated_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS limit_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS month TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS period TEXT;

-- Ensure category_id accepts text category names (like 'Food', '__total__')
DO $$ BEGIN
    ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;
    ALTER TABLE public.budgets ALTER COLUMN category_id TYPE TEXT USING category_id::text;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Synchronize alias columns with explicit UUID casting
UPDATE public.budgets 
SET user_id = owner_id::uuid 
WHERE user_id IS NULL 
  AND owner_id IS NOT NULL 
  AND owner_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

UPDATE public.budgets 
SET owner_id = user_id::text 
WHERE owner_id IS NULL 
  AND user_id IS NOT NULL;

UPDATE public.budgets SET allocated_amount = limit_amount WHERE (allocated_amount IS NULL OR allocated_amount = 0) AND limit_amount > 0;
UPDATE public.budgets SET limit_amount = allocated_amount WHERE (limit_amount IS NULL OR limit_amount = 0) AND allocated_amount > 0;
UPDATE public.budgets SET month = to_char(CURRENT_DATE, 'YYYY-MM') WHERE month IS NULL;

-- Dynamically cast category_id to category if category_id exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'category_id'
    ) THEN
        EXECUTE 'UPDATE public.budgets SET category = category_id::text WHERE category IS NULL AND category_id IS NOT NULL';
    END IF;

    -- If period exists and is of enum type, set default safely without type error
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'period'
    ) THEN
        BEGIN
            EXECUTE 'UPDATE public.budgets SET period = ''monthly''::budget_period WHERE period IS NULL';
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignore if budget_period enum is not defined
        END;
    END IF;
END $$;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can manage their own budgets') THEN
        CREATE POLICY "Users can manage their own budgets"
            ON public.budgets FOR ALL
            USING (auth.uid() = user_id OR auth.uid()::text = owner_id);
    END IF;
END $$;

-- 4. TRANSACTIONS TABLE (Simulated expenses & income)
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions column migration safety
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Ensure category_id in transactions accepts text category names (like 'Food', 'Savings')
DO $$ BEGIN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;
    ALTER TABLE public.transactions ALTER COLUMN category_id TYPE TEXT USING category_id::text;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

UPDATE public.transactions 
SET user_id = owner_id::uuid 
WHERE user_id IS NULL 
  AND owner_id IS NOT NULL 
  AND owner_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

UPDATE public.transactions 
SET owner_id = user_id::text 
WHERE owner_id IS NULL 
  AND user_id IS NOT NULL;

-- Dynamically cast category_id to category if category_id exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'category_id'
    ) THEN
        EXECUTE 'UPDATE public.transactions SET category = category_id::text WHERE category IS NULL AND category_id IS NOT NULL';
    END IF;
END $$;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can manage their own transactions') THEN
        CREATE POLICY "Users can manage their own transactions"
            ON public.transactions FOR ALL
            USING (auth.uid() = user_id OR auth.uid()::text = owner_id);
    END IF;
END $$;

-- 5. SAVING CHALLENGES / GOALS TABLE
CREATE TABLE IF NOT EXISTS public.saving_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Savings Goal',
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    end_date DATE,
    icon TEXT DEFAULT 'PiggyBank',
    color TEXT DEFAULT '#10B981',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration safety for saving_challenges
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Savings Goal';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'PiggyBank';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10B981';

ALTER TABLE public.saving_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saving_challenges' AND policyname = 'Users can manage their own saving challenges') THEN
        CREATE POLICY "Users can manage their own saving challenges"
            ON public.saving_challenges FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

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

-- 6. SIMULATED INVESTMENTS & PORTFOLIO
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

ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_investments' AND policyname = 'Users can manage their own simulated investments') THEN
        CREATE POLICY "Users can manage their own simulated investments"
            ON public.user_investments FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. PARENTAL / GUARDIAN LOGS
CREATE TABLE IF NOT EXISTS public.guardian_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_email TEXT NOT NULL,
    financial_health_score INTEGER NOT NULL,
    streak_days INTEGER NOT NULL,
    badges_count INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guardian_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guardian_reports' AND policyname = 'Users can view and record their guardian reports') THEN
        CREATE POLICY "Users can view and record their guardian reports"
            ON public.guardian_reports FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 8. TRIGGER: Auto-create profile on auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. RPC FUNCTION: Allow authenticated users to delete their own account (GDPR compliance)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
