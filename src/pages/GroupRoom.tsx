/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ClubGroupChat from '@/components/ClubGroupChat';
import { ArrowLeft } from 'lucide-react';

export default function GroupRoom() {
  const { clubId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clubName, setClubName] = useState<string>('');
  const [isMember, setIsMember] = useState<boolean>(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !clubId) return;
      try {
        const sb: any = supabase as any;
        const { data: club, error: cErr } = await sb
          .from('interest_clubs')
          .select('id, name')
          .eq('id', clubId)
          .maybeSingle();
        if (cErr || !club) throw cErr || new Error('Club not found');
        setClubName(club.name);

        const { data: mem, error: mErr } = await sb
          .from('club_members')
          .select('id')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (mErr) throw mErr;
        setIsMember(!!mem);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load group';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user, clubId]);

  const leaveClub = async () => {
    if (!user || !clubId) return;
    setLeaving(true);
    try {
      const sb: any = supabase as any;
      const { error } = await sb
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Left club', description: `You left ${clubName}` });
      navigate('/groups');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to leave club';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLeaving(false);
    }
  };

  if (!clubId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/groups')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{clubName || 'Group'}</h1>
          </div>
          {isMember && (
            <Button size="sm" variant="destructive" onClick={leaveClub} disabled={leaving}>
              {leaving ? 'Leaving...' : 'Leave Club'}
            </Button>
          )}
        </div>

        {!isMember ? (
          <Card>
            <CardHeader>
              <CardTitle>Join required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm opacity-80">You are not a member of this club. Join it from the Clubs page to access the group chat.</div>
            </CardContent>
          </Card>
        ) : (
          <ClubGroupChat clubId={clubId} />
        )}
      </div>
    </div>
  );
}
