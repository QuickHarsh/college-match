-- Wallet schema: user_coins, coin_transactions, and credit_coins RPC

create table if not exists public.user_coins (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  balance integer not null default 0,
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  amount integer not null,
  transaction_type text not null check (transaction_type in ('earned','spent','refund')),
  provider text null,
  provider_ref text null,
  description text null,
  created_at timestamptz not null default now()
);

alter table public.user_coins enable row level security;
alter table public.coin_transactions enable row level security;

-- RLS policies
DO $$ BEGIN
  BEGIN
    DROP POLICY IF EXISTS "user_coins self read" ON public.user_coins;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "user_coins self read" ON public.user_coins FOR SELECT TO authenticated USING (user_id = auth.uid());
END $$;

DO $$ BEGIN
  BEGIN
    DROP POLICY IF EXISTS "coin_tx self read" ON public.coin_transactions;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "coin_tx self read" ON public.coin_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
END $$;

-- RPC to credit coins (dev/test). In production, wire this to a validated payment webhook.
CREATE OR REPLACE FUNCTION public.credit_coins(p_user_id uuid, p_amount integer, p_desc text DEFAULT 'Manual credit')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF p_amount <= 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_coins (user_id, balance, total_earned, total_spent)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.user_coins.balance + excluded.balance,
      total_earned = public.user_coins.total_earned + excluded.balance,
      updated_at = now();

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'earned', coalesce(p_desc, 'Manual credit'));

  RETURN TRUE;
END;
$$;
