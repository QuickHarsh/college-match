/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send } from 'lucide-react';

interface MatchItem {
  match_id: string;
  other_user_id: string;
  full_name: string;
  profile_image_url: string | null;
}

export default function Chats() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchItem[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const sb: any = supabase as any;
        // Get mutual matches
        const { data: m, error: mErr } = await sb
          .from('matches')
          .select('id, user1_id, user2_id, is_mutual')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_mutual', true);
        if (mErr) throw mErr;
        const others = (m || []).map((row: any) => ({ match_id: row.id, other_user_id: row.user1_id === user.id ? row.user2_id : row.user1_id }));
        const otherIds = others.map((o: any) => o.other_user_id);
        if (otherIds.length === 0) { setMatches([]); return; }
        const { data: profs, error: pErr } = await sb
          .from('profiles')
          .select('user_id, full_name, profile_image_url')
          .in('user_id', otherIds);
        if (pErr) throw pErr;
        type Prof = { user_id: string; full_name: string; profile_image_url: string | null };
        const profArr = (profs || []) as Prof[];
        const map = new Map<string, Prof>(profArr.map((p) => [p.user_id, p]));
        const list: MatchItem[] = others.map((o: any) => {
          const p = map.get(o.other_user_id);
          return {
            match_id: o.match_id,
            other_user_id: o.other_user_id,
            full_name: p?.full_name || 'Student',
            profile_image_url: p?.profile_image_url || null,
          };
        });
        setMatches(list);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load chats';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Chats</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches yet. Like some profiles or check events!</p>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <div key={m.match_id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                        {m.profile_image_url ? (
                          <img src={m.profile_image_url} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium">{m.full_name}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/chat/${m.match_id}`)}>
                      <Send className="h-4 w-4 mr-2" /> Open
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
