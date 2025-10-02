/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LikeItem {
  liker_id: string;
  profile: {
    full_name: string;
    profile_image_url: string | null;
    branch: string | null;
    college_name: string | null;
  } | null;
}

export default function Likes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LikeItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const sb: any = supabase as any;
        const { data, error } = await sb
          .from('likes')
          .select('liker_id')
          .eq('liked_id', user.id);
        if (error) throw error;
        let likerIds: string[] = ((data || []) as Array<{ liker_id: string }>).map((d) => d.liker_id);
        // Remove users who are already in connections (mutual matches)
        if (likerIds.length > 0) {
          const list = likerIds.map((id) => id).join(',');
          const { data: mutuals, error: mErr } = await sb
            .from('matches')
            .select('user1_id, user2_id, is_mutual')
            .eq('is_mutual', true)
            .or(`and(user1_id.eq.${user.id},user2_id.in.(${list})),and(user2_id.eq.${user.id},user1_id.in.(${list}))`);
          if (mErr) throw mErr;
          const connected = new Set<string>((mutuals || []).map((m: any) => (m.user1_id === user.id ? m.user2_id : m.user1_id)));
          likerIds = likerIds.filter((id) => !connected.has(id));
        }
        if (likerIds.length === 0) {
          setItems([]);
          return;
        }
        const { data: profs, error: pErr } = await sb
          .from('profiles')
          .select('user_id, full_name, profile_image_url, branch, college_name')
          .in('user_id', likerIds);
        if (pErr) throw pErr;
        type Prof = { user_id: string; full_name: string; profile_image_url: string | null; branch: string | null; college_name: string | null };
        const profArr = (profs || []) as Prof[];
        const map = new Map<string, Prof>(profArr.map((p) => [p.user_id, p]));
        const next: LikeItem[] = likerIds.map((id) => {
          const p = map.get(id);
          return {
            liker_id: id,
            profile: p
              ? { full_name: p.full_name, profile_image_url: p.profile_image_url, branch: p.branch, college_name: p.college_name }
              : null,
          };
        });
        setItems(next);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load likes';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user]);

  const likeBack = async (likerId: string) => {
    if (!user) return;
    setBusy(true);
    try {
      const sb: any = supabase as any;
      const { data: ok, error: spendErr } = await sb.rpc('spend_one_coin', { p_user_id: user.id });
      if (spendErr) throw spendErr;
      if (!ok) {
        toast({ title: 'Not enough coins', description: 'Buy coins to like back' });
        return;
      }
      const { error: likeErr } = await sb
        .from('likes')
        .upsert({ liker_id: user.id, liked_id: likerId }, { onConflict: 'liker_id,liked_id', ignoreDuplicates: true });
      if (likeErr) throw likeErr;
      // Optimistically remove from incoming likes list
      setItems((prev) => prev.filter((it) => it.liker_id !== likerId));
      toast({ title: "Liked back!", description: "If it's mutual, chat will unlock." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to like back';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-2">
          {/* Placeholder for logo (intentionally empty). Replace with your custom logo when ready. */}
          <div className="h-6 w-6" aria-hidden />
          <h1 className="text-2xl font-bold">Who liked you</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Incoming Likes</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No likes yet. Keep exploring and join events!</p>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div key={it.liker_id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                        {it.profile?.profile_image_url ? (
                          <img src={it.profile.profile_image_url} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium">{it.profile?.full_name || 'Student'}</div>
                        <div className="text-xs text-muted-foreground">{it.profile?.branch || 'Branch'} • {it.profile?.college_name || 'College'}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => likeBack(it.liker_id)} disabled={busy}>
                      <UserPlus className="h-4 w-4 mr-2" /> Like back (−1)
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
