-- Function to cleanup likes between two users when their match is deleted
CREATE OR REPLACE FUNCTION public.cleanup_likes_on_match_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the likes between the two users involved in the deleted match
  DELETE FROM public.likes
  WHERE (liker_id = OLD.user1_id AND liked_id = OLD.user2_id)
     OR (liker_id = OLD.user2_id AND liked_id = OLD.user1_id);
     
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the cleanup function after a match is deleted
DROP TRIGGER IF EXISTS on_match_deleted_cleanup_likes ON public.matches;
CREATE TRIGGER on_match_deleted_cleanup_likes
AFTER DELETE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.cleanup_likes_on_match_delete();
