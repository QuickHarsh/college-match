/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Video, Search, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { usePresence } from '@/hooks/usePresence';

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isUserOnline } = usePresence();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
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
        console.error(e);
        toast.error('Failed to load connections');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const filteredItems = items.filter(item =>
    item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.college_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startCall = async (matchId: string, otherUserId: string) => {
    if (!user) return;
    try {
      const sb: any = supabase;

      // 1. Get or Create Room
      let roomId;
      const { data: room, error: rErr } = await sb
        .from('chat_rooms')
        .select('id')
        .eq('match_id', matchId)
        .maybeSingle();

      if (room) {
        roomId = room.id;
      } else {
        const { data: newRoom, error: nrErr } = await sb
          .from('chat_rooms')
          .insert({ match_id: matchId })
          .select('id')
          .single();
        if (nrErr) throw nrErr;
        roomId = newRoom.id;
      }

      // 2. Send Invite Signal
      const channel = sb.channel(`notify-${otherUserId}`);
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'call_invite',
            payload: { roomId, callerId: user.id, callerName: user.user_metadata.full_name }
          });

          // 3. Navigate
          toast.success('Calling...', { description: 'Waiting for them to join.' });
          navigate(`/match/video?room=${roomId}`);
        }
      });

    } catch (e) {
      console.error(e);
      toast.error('Failed to start call');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-950 dark:via-black dark:to-gray-900 pt-20 pb-20">
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Connections
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Your network of mutual matches
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-indigo-100 dark:border-indigo-900/30 focus:ring-indigo-500 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading your network...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl"
          >
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No matches found' : 'No connections yet'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {searchQuery ? 'Try a different search term.' : 'Start swiping to find your people!'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/match')}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 shadow-lg shadow-indigo-500/20 px-8"
              >
                Find Matches
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredItems.map((it, i) => (
                <motion.div
                  key={it.match_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar with Presence */}
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-cyan-400">
                        <div className="w-full h-full rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={it.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${it.full_name}`}
                            alt={it.full_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      </div>
                      <div className={`absolute bottom-1 right-1 w-5 h-5 border-4 border-white dark:border-gray-900 rounded-full ${isUserOnline(it.user_id) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{it.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{it.branch || 'Student'}</p>
                      <p className="text-xs text-indigo-500 font-medium">{it.college_name || 'College'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-full border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        onClick={() => navigate(`/chat/${it.match_id}`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                        onClick={() => startCall(it.match_id, it.user_id)}
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
