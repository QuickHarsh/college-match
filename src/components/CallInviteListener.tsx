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
    if (!user) {
      console.log("CallInviteListener: No user logged in");
      return;
    }
    const channelName = `notify-${user.id}`;
    console.log("CallInviteListener: Subscribing to", channelName);

    const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } });
    let mounted = true;

    channel.on('broadcast', { event: 'call_invite' }, (evt) => {
      console.log("CallInviteListener: Received call_invite event", evt);
      if (!mounted) return;

      const payload = evt.payload;
      const roomId = payload?.roomId;
      const callerId = payload?.callerId;

      if (!roomId) return;

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
              <p className="text-sm text-muted-foreground">{payload?.callerName ? `${payload.callerName} is calling...` : "A match wants to connect!"}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                toast.dismiss(t);
                console.log("Reject clicked. CallerID available:", callerId);

                if (callerId) {
                  const channelName = `notify-${callerId}`;
                  console.log("Sending call_rejected to:", channelName);

                  const c = supabase.channel(channelName);
                  c.subscribe((status) => {
                    console.log(`Transient channel ${channelName} status:`, status);
                    if (status === 'SUBSCRIBED') {
                      c.send({
                        type: 'broadcast',
                        event: 'call_rejected',
                        payload: { rejecterId: user.id }
                      }).then(res => console.log("Sent rejection:", res));

                      // Cleanup transient channel after sending
                      setTimeout(() => {
                        console.log("Cleaning up transient channel");
                        supabase.removeChannel(c);
                      }, 1000);
                    }
                  });
                } else {
                  console.error("Cannot reject: No callerId found in payload");
                }
              }}
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
      ), { duration: 30000 });
    });

    // Handle Call Rejection (For the Caller)
    channel.on('broadcast', { event: 'call_rejected' }, (evt) => {
      console.log("CallInviteListener: Received call_rejected event!", evt);

      toast.error("Call Rejected", { description: "User is busy or declined the call." });

      // Check if currently on the video call page (as a caller waiting)
      if (window.location.pathname.includes('/match/video')) {
        console.log("Navigating back to /match");
        navigate('/match'); // Or wherever appropriate
      } else {
        console.log("Not on video page, just showing toast");
      }
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
