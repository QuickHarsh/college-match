-- Atomic coin spending function
CREATE OR REPLACE FUNCTION public.spend_one_coin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  current_balance integer;
BEGIN
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

-- Allow authenticated users to call this function for themselves only via RLS checks in callers.
