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
};

export async function fetchCandidates(currentUserId: string, limit = 20): Promise<Candidate[]> {
  // Fetch verified profiles other than me
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, college_name, branch, year_of_study, age, bio, interests, profile_image_url, is_verified')
    .neq('user_id', currentUserId)
    .eq('is_verified', true)
    .limit(limit);

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

  // If mutual, try to find chat_room and notify the other user to join video call
  if (match && match.is_mutual) {
    const otherUserId = match.user1_id === likerId ? match.user2_id : match.user1_id;
    const { data: room } = await sb
      .from('chat_rooms')
      .select('id')
      .eq('match_id', match.id)
      .maybeSingle();

    if (room?.id) {
      try {
        const channel = (sb).channel?.(`notify-${otherUserId}`, { config: { broadcast: { self: false } } });
        if (channel) {
          await channel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              channel.send({ type: 'broadcast', event: 'call_invite', payload: { roomId: room.id, fromUserId: likerId } });
              // small delay then remove channel to avoid leaks
              setTimeout(() => { (sb).removeChannel?.(channel); }, 500);
            }
          });
        }
      } catch {
        // best effort
      }
    }
  }

  return { isMutual: !!match };
}
