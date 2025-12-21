/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/integrations/supabase/client';

export type Candidate = {
  user_id: string;
  full_name: string;
  college_name: string | null;
  branch: string | null;
  year_of_study: number | null;
  age: number | null;
  bio: string | null;
  interests: string[] | null;
  profile_image_url: string | null;
  is_verified?: boolean;
  gender?: string;
  looking_for?: string;
  height?: string;
  zodiac?: string;
  religion?: string;
  drinking?: string;
  smoking?: string;
  fitness?: string;
};

export async function fetchCandidates(currentUserId: string, limit = 20): Promise<Candidate[]> {
  const sb: any = supabase;

  // 1. Get existing matches (mutual) to exclude them
  const { data: existingMatches } = await sb
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
    .eq('is_mutual', true);

  const excludedIds = [currentUserId];
  if (existingMatches) {
    existingMatches.forEach((m: any) => {
      if (m.user1_id !== currentUserId) excludedIds.push(m.user1_id);
      if (m.user2_id !== currentUserId) excludedIds.push(m.user2_id);
    });
  }

  // 2. Fetch verified profiles NOT in the excluded list
  // Note: .not('user_id', 'in', `(${...})`) requires a parenthesis-wrapped comma-separated string for the value
  const notInString = `(${excludedIds.join(',')})`;

  // 2. Fetch current user to get their preferences
  const { data: me } = await sb
    .from('profiles')
    .select('preferred_gender')
    .eq('user_id', currentUserId)
    .single();

  const pref = me?.preferred_gender;

  // 3. Build query
  let query = sb
    .from('profiles')
    .select('user_id, full_name, college_name, branch, year_of_study, age, bio, interests, profile_image_url, is_verified, gender, looking_for, height, zodiac, religion, drinking, smoking, fitness')
    .not('user_id', 'in', notInString)
    .eq('is_verified', true);

  // Apply Gender Filter
  if (pref && pref !== 'Everyone') {
    query = query.eq('gender', pref);
  }

  const { data, error } = await query.limit(limit);

  if (error) throw error;
  return (data || []) as unknown as Candidate[];
}

export async function likeUser(likerId: string, likedId: string) {
  // Use an unsafe cast for non-typed tables (user_coins, likes, matches, coin_transactions)
  const sb: any = supabase as any;

  // Spend 1 coin atomically via RPC (migration added)
  const { data: ok, error: spendErr } = await sb.rpc('spend_one_coin', { p_user_id: likerId });
  if (spendErr) throw spendErr;
  if (!ok) throw new Error('Insufficient coins. Buy coins to like more profiles.');

  // Insert like (avoid 409 by upsert on unique key)
  const { error: likeErr } = await sb
    .from('likes')
    .upsert({ liker_id: likerId, liked_id: likedId }, { onConflict: 'liker_id,liked_id', ignoreDuplicates: true });
  if (likeErr) {
    throw likeErr;
  }

  // Check if mutual by querying matches
  const { data: match } = await sb
    .from('matches')
    .select('id, user1_id, user2_id, is_mutual')
    .in('user1_id', [likerId, likedId])
    .in('user2_id', [likerId, likedId])
    .eq('is_mutual', true)
    .maybeSingle();

  // Code removed: Automatic video call invite on match was causing issues.
  // if (match && match.is_mutual) { ... }

  return { isMutual: !!match };
}
