-- Admins have unlimited coins: bypass spending in RPC
-- Replaces spend_one_coin to early-return TRUE if user is admin

CREATE OR REPLACE FUNCTION public.spend_one_coin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  current_balance integer;
  is_admin boolean;
BEGIN
  -- Admin bypass: if user is admin, do not decrement; always allow
  SELECT coalesce(p.is_admin, false) INTO is_admin
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  IF is_admin THEN
    RETURN TRUE;
  END IF;

  -- Lock the row to prevent race conditions
  SELECT balance INTO current_balance FROM public.user_coins
  WHERE user_id = p_user_id FOR UPDATE;

  IF current_balance IS NULL THEN
    -- Initialize if missing
    INSERT INTO public.user_coins (user_id, balance, total_earned, total_spent)
    VALUES (p_user_id, 20, 20, 0)
    ON CONFLICT (user_id) DO NOTHING;
    current_balance := 20;
  END IF;

  IF current_balance <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_coins
  SET balance = balance - 1,
      total_spent = total_spent + 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'spent', 'Like consumed 1 coin');

  RETURN TRUE;
END;
$$;
