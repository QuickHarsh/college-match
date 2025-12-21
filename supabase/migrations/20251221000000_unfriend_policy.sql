-- Allow users to delete their own matches (Unfriend)
CREATE POLICY "Users can delete their own matches"
ON public.matches FOR DELETE TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);
