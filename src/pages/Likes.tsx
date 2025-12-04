/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserPlus, Heart, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface LikeItem {
  liker_id: string;
  profile: {
    full_name: string;
    profile_image_url: string | null;
    branch: string | null;
    college_name: string | null;
  } | null;
}

export default function Likes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LikeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const sb: any = supabase as any;
        const { data, error } = await sb
          .from('likes')
          .select('liker_id')
          .eq('liked_id', user.id);
        if (error) throw error;
        let likerIds: string[] = ((data || []) as Array<{ liker_id: string }>).map((d) => d.liker_id);

        // Remove users who are already in connections (mutual matches)
        if (likerIds.length > 0) {
          const list = likerIds.map((id) => id).join(',');
          const { data: mutuals, error: mErr } = await sb
            .from('matches')
            .select('user1_id, user2_id, is_mutual')
            .eq('is_mutual', true)
            .or(`and(user1_id.eq.${user.id},user2_id.in.(${list})),and(user2_id.eq.${user.id},user1_id.in.(${list}))`);
          if (mErr) throw mErr;
          const connected = new Set<string>((mutuals || []).map((m: any) => (m.user1_id === user.id ? m.user2_id : m.user1_id)));
          likerIds = likerIds.filter((id) => !connected.has(id));
        }

        if (likerIds.length === 0) {
          setItems([]);
          return;
        }

        const { data: profs, error: pErr } = await sb
          .from('profiles')
          .select('user_id, full_name, profile_image_url, branch, college_name')
          .in('user_id', likerIds);
        if (pErr) throw pErr;

        type Prof = { user_id: string; full_name: string; profile_image_url: string | null; branch: string | null; college_name: string | null };
        const profArr = (profs || []) as Prof[];
        const map = new Map<string, Prof>(profArr.map((p) => [p.user_id, p]));

        const next: LikeItem[] = likerIds.map((id) => {
          const p = map.get(id);
          return {
            liker_id: id,
            profile: p
              ? { full_name: p.full_name, profile_image_url: p.profile_image_url, branch: p.branch, college_name: p.college_name }
              : null,
          };
        });
        setItems(next);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load likes');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const likeBack = async (likerId: string) => {
    if (!user) return;
    setBusyId(likerId);
    try {
      const sb: any = supabase as any;
      const { data: ok, error: spendErr } = await sb.rpc('spend_one_coin', { p_user_id: user.id });
      if (spendErr) throw spendErr;
      if (!ok) {
        toast.error('Not enough coins! Buy more to match.');
        setBusyId(null);
        return;
      }

      const { error: likeErr } = await sb
        .from('likes')
        .upsert({ liker_id: user.id, liked_id: likerId }, { onConflict: 'liker_id,liked_id', ignoreDuplicates: true });
      if (likeErr) throw likeErr;

      // Success!
      toast.success("It's a Match! 🎉", {
        description: "You can now chat with them.",
      });

      // Remove from list with animation delay
      setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.liker_id !== likerId));
        setBusyId(null);
      }, 500);

    } catch (e) {
      console.error(e);
      toast.error('Failed to like back');
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-black dark:to-gray-900 pt-20 pb-20">
      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              Likes <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              People who want to connect with you
            </p>
          </div>
          <div className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-medium shadow-sm">
            {items.length} Pending
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            <p className="text-muted-foreground animate-pulse">Finding your admirers...</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl"
          >
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No new likes yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Don't worry! Keep your profile updated and join more events to get noticed.
            </p>
            <Button
              onClick={() => navigate('/match')}
              className="rounded-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 shadow-lg shadow-rose-500/20 px-8"
            >
              Start Matching
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {items.map((it, i) => (
                <motion.div
                  key={it.liker_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image Area */}
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <img
                      src={it.profile?.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${it.profile?.full_name}`}
                      alt={it.profile?.full_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute bottom-4 left-4 z-20 text-white">
                      <h3 className="text-xl font-bold">{it.profile?.full_name || 'Student'}</h3>
                      <p className="text-sm text-gray-200 flex items-center gap-1">
                        {it.profile?.branch || 'Unknown Branch'}
                      </p>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="p-4 bg-white dark:bg-gray-900 relative z-20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        {it.profile?.college_name || 'Unknown College'}
                      </div>
                      <Button
                        onClick={() => likeBack(it.liker_id)}
                        disabled={busyId === it.liker_id}
                        className="rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                        size="sm"
                      >
                        {busyId === it.liker_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1.5" />
                            Accept
                          </>
                        )}
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
