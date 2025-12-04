/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ClubGroupChat from '@/components/ClubGroupChat';
import { ArrowLeft, Users, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GroupRoom() {
  const { clubId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clubName, setClubName] = useState<string>('');
  const [clubIcon, setClubIcon] = useState<string>('');
  const [isMember, setIsMember] = useState<boolean>(false);
  const [leaving, setLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !clubId) return;
      try {
        setIsLoading(true);
        const sb: any = supabase as any;
        const { data: club, error: cErr } = await sb
          .from('interest_clubs')
          .select('id, name, icon')
          .eq('id', clubId)
          .maybeSingle();
        if (cErr || !club) throw cErr || new Error('Club not found');
        setClubName(club.name);
        setClubIcon(club.icon);

        const { data: mem, error: mErr } = await sb
          .from('club_members')
          .select('id')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (mErr) throw mErr;
        setIsMember(!!mem);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load group');
      } finally {
        setIsLoading(false);
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
      toast.success(`You left ${clubName}`);
      navigate('/groups');
    } catch (e) {
      console.error(e);
      toast.error('Failed to leave club');
    } finally {
      setLeaving(false);
    }
  };

  if (!clubId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col z-50">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/groups')}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-xl shadow-inner">
              {clubIcon || '⭐'}
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white leading-tight">
                {clubName || 'Group'}
              </h1>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
        </div>

        {isMember && (
          <Button
            variant="ghost"
            size="sm"
            onClick={leaveClub}
            disabled={leaving}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-black/20">
        {!isMember ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold">Join Required</h3>
            <p className="text-muted-foreground max-w-xs">
              You need to be a member of this club to view and send messages.
            </p>
            <Button onClick={() => navigate('/clubs')}>
              Go to Clubs
            </Button>
          </div>
        ) : (
          <ClubGroupChat clubId={clubId} />
        )}
      </div>
    </div>
  );
}
