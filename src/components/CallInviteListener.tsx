/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';

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

      // Show Accept/Reject Toast
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl w-full max-w-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Incoming Video Call</h3>
              <p className="text-sm text-muted-foreground">A match wants to connect!</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => toast.dismiss(t)}
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                toast.dismiss(t);
                navigate(`/match/video?room=${roomId}`);
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      ), { duration: 30000 }); // Ring for 30s
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
