-- Retroactive cleanup for "ghost" likes
-- Deletes likes where a mutual connection (A likes B AND B likes A) exists 
-- BUT no corresponding match record exists in the matches table.

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 1. Identify pairs (user1, user2) that mutually like each other but have NO match
  WITH mutual_likes AS (
    SELECT l1.liker_id as u1, l1.liked_id as u2
    FROM public.likes l1
    JOIN public.likes l2 ON l1.liker_id = l2.liked_id AND l1.liked_id = l2.liker_id
    WHERE l1.liker_id < l1.liked_id -- Ensure we only process the pair once
  ),
  orphaned_pairs AS (
    SELECT ml.u1, ml.u2
    FROM mutual_likes ml
    LEFT JOIN public.matches m 
      ON (m.user1_id = ml.u1 AND m.user2_id = ml.u2) 
      OR (m.user1_id = ml.u2 AND m.user2_id = ml.u1)
    WHERE m.id IS NULL
  )
  -- 2. Delete the associated likes
  DELETE FROM public.likes
  WHERE EXISTS (
    SELECT 1 FROM orphaned_pairs op
    WHERE (liker_id = op.u1 AND liked_id = op.u2)
       OR (liker_id = op.u2 AND liked_id = op.u1)
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % orphaned likes.', deleted_count;
END $$;
