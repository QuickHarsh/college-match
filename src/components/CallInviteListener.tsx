/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function CallInviteListener() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`notify-${user.id}`, { config: { broadcast: { self: false } } });
    let mounted = true;
    channel.on('broadcast', { event: 'call_invite' }, (payload) => {
      if (!mounted) return;
      const roomId = (payload as any)?.payload?.roomId as string | undefined;
      if (!roomId) return;
      toast({ title: "It's a Match! 🎉", description: 'Opening video chat...' });
      navigate(`/match/video?room=${roomId}`);
    });
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
    });

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) { console.error('removeChannel error', e); }
    };
  }, [user, navigate]);

  return null;
}
