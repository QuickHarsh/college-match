/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
}

export default function Clubs() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const sb: any = supabase as any;
        const { data: c, error: cErr } = await sb
          .from('interest_clubs')
          .select('id, name, description, category, icon')
          .order('name');
        if (cErr) throw cErr;
        setClubs((c || []) as Club[]);

        const { data: mine, error: mErr } = await sb
          .from('club_members')
          .select('club_id')
          .eq('user_id', user.id);
        if (mErr) throw mErr;
        setMyClubIds(new Set(((mine || []) as Array<{ club_id: string }>).map((m) => m.club_id)));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load clubs';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user]);

  const toggleJoin = async (club: Club) => {
    if (!user) return;
    setBusy(club.id);
    try {
      const sb: any = supabase as any;
      if (myClubIds.has(club.id)) {
        // leave
        const { error } = await sb
          .from('club_members')
          .delete()
          .eq('club_id', club.id)
          .eq('user_id', user.id);
        if (error) throw error;
        const s = new Set(myClubIds);
        s.delete(club.id);
        setMyClubIds(s);
        toast({ title: `Left ${club.name}` });
      } else {
        // join
        const { error } = await sb
          .from('club_members')
          .upsert({ club_id: club.id, user_id: user.id }, { onConflict: 'club_id,user_id', ignoreDuplicates: true });
        if (error) throw error;
        const s = new Set(myClubIds);
        s.add(club.id);
        setMyClubIds(s);
        toast({ title: `Joined ${club.name}` });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update club membership';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Interest Clubs</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club, i) => (
            <motion.div key={club.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.03 }} whileHover={{ y: -4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{club.icon || '⭐'}</span>
                    {club.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{club.description || '—'}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs opacity-70 flex items-center gap-2">
                      <Star className="h-3 w-3" /> {club.category}
                    </div>
                    <Button size="sm" onClick={() => toggleJoin(club)} disabled={busy === club.id}>
                      {myClubIds.has(club.id) ? 'Leave' : 'Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
