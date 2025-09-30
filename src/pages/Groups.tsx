/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
}

export default function Groups() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const sb: any = supabase as any;
        const { data, error } = await sb
          .from('interest_clubs')
          .select('id, name, description, category, icon, club_members!inner(user_id)')
          .eq('club_members.user_id', user.id)
          .order('name');
        if (error) throw error;
        setClubs((data || []) as Club[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load your groups';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 flex items-center gap-2">
          <Users2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Groups</h1>
        </motion.div>

        {clubs.length === 0 ? (
          <div className="text-sm opacity-70">You haven't joined any clubs yet. Explore clubs to join one and unlock its group chat.</div>
        ) : (
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
                    <div className="flex items-center justify-end">
                      <Button size="sm" onClick={() => navigate(`/groups/${club.id}`)}>Open Group</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
