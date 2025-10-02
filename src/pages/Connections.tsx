/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';

interface ConnectionItem {
  match_id: string;
  user_id: string;
  full_name: string;
  profile_image_url: string | null;
  branch: string | null;
  college_name: string | null;
}

export default function Connections() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ConnectionItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const sb: any = supabase as any;
        // Fetch mutual matches where current user is user1 or user2
        const { data: matches, error: mErr } = await sb
          .from('matches')
          .select('id, user1_id, user2_id, is_mutual')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_mutual', true)
          .order('created_at', { ascending: false });
        if (mErr) throw mErr;
        const others: { match_id: string; other_id: string }[] = (matches || []).map((m: any) => ({
          match_id: m.id,
          other_id: m.user1_id === user.id ? m.user2_id : m.user1_id,
        }));
        if (others.length === 0) { setItems([]); return; }
        const { data: profs, error: pErr } = await sb
          .from('profiles')
          .select('user_id, full_name, profile_image_url, branch, college_name')
          .in('user_id', others.map(o => o.other_id));
        if (pErr) throw pErr;
        const map = new Map<string, any>((profs || []).map((p: any) => [p.user_id, p]));
        const next: ConnectionItem[] = others.map(({ match_id, other_id }) => {
          const p = map.get(other_id);
          return {
            match_id,
            user_id: other_id,
            full_name: p?.full_name || 'Student',
            profile_image_url: p?.profile_image_url || null,
            branch: p?.branch || null,
            college_name: p?.college_name || null,
          };
        });
        setItems(next);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load connections';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-6 w-6" aria-hidden />
          <h1 className="text-2xl font-bold">Connections</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your mutual matches</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No connections yet. Like and get liked back to connect.</p>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div key={it.match_id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                        {it.profile_image_url ? (
                          <img src={it.profile_image_url} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium">{it.full_name}</div>
                        <div className="text-xs text-muted-foreground">{it.branch || 'Student'} • {it.college_name || 'College'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/chat/${it.match_id}`)}>
                        <MessageCircle className="h-4 w-4 mr-1" /> Chat
                      </Button>
                    </div>
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
