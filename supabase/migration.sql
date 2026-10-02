-- ==============================================================================
-- CBUDGET / WALLETLY — RUN THIS SCRIPT IN SUPABASE SQL EDITOR
-- ==============================================================================
-- Upgrades existing database tables safely:
-- 1. `profiles`: adds guardian, age, onboarding, and contact columns.
-- 2. `budgets`: adds category (text), month (text), allocated_amount, user_id.
-- 3. `transactions`: adds category (text), user_id, updated_at.
-- 4. `saving_challenges`: adds title/icon/color & creates `savings_goals` view.
-- 5. `user_investments` and `guardian_reports`: created with RLS.
-- 6. `delete_user()`: GDPR account deletion function.
-- ==============================================================================

-- 1. PROFILES UPGRADE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_linked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_grade TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. BUDGETS UPGRADE
CREATE TABLE IF NOT EXISTS public.budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT,
    allocated_amount NUMERIC(12, 2) DEFAULT 0.00,
    month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS allocated_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS limit_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');

-- Backfill data safely
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

-- 3. TRANSACTIONS UPGRADE
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    type TEXT NOT NULL,
    category TEXT,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

UPDATE public.transactions 
SET user_id = owner_id::uuid 
WHERE user_id IS NULL 
  AND owner_id IS NOT NULL 
  AND owner_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

UPDATE public.transactions 
SET owner_id = user_id::text 
WHERE owner_id IS NULL 
  AND user_id IS NOT NULL;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'category_id'
    ) THEN
        EXECUTE 'UPDATE public.transactions SET category = category_id::text WHERE category IS NULL AND category_id IS NOT NULL';
    END IF;
END $$;

-- 4. SAVING CHALLENGES UPGRADE & SAVINGS GOALS VIEW
CREATE TABLE IF NOT EXISTS public.saving_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    end_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    title TEXT DEFAULT 'Savings Goal',
    icon TEXT DEFAULT 'PiggyBank',
    color TEXT DEFAULT '#10B981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Savings Goal';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'PiggyBank';
ALTER TABLE public.saving_challenges ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10B981';

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

DO $$ BEGIN
    ALTER VIEW public.savings_goals SET (security_invoker = on);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 5. USER INVESTMENTS TABLE
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

-- 6. GUARDIAN REPORTS TABLE
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

-- 7. RLS POLICIES FOR BUDGETS & TRANSACTIONS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can manage their own budgets') THEN
        CREATE POLICY "Users can manage their own budgets"
            ON public.budgets FOR ALL
            USING (auth.uid() = user_id OR auth.uid()::text = owner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can manage their own transactions') THEN
        CREATE POLICY "Users can manage their own transactions"
            ON public.transactions FOR ALL
            USING (auth.uid() = user_id OR auth.uid()::text = owner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saving_challenges' AND policyname = 'Users can manage their own saving challenges') THEN
        CREATE POLICY "Users can manage their own saving challenges"
            ON public.saving_challenges FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 8. GDPR ACCOUNT DELETION FUNCTION
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. PERMISSIONS GRANT
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.budgets TO authenticated, service_role;
GRANT ALL ON public.transactions TO authenticated, service_role;
GRANT ALL ON public.saving_challenges TO authenticated, service_role;
GRANT ALL ON public.savings_goals TO authenticated, service_role;
GRANT ALL ON public.user_investments TO authenticated, service_role;
GRANT ALL ON public.guardian_reports TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
