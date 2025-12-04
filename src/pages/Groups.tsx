/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users2, ArrowRight, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isLoading, setIsLoading] = useState(true);

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
          .from('interest_clubs')
          .select('id, name, description, category, icon, club_members!inner(user_id)')
          .eq('club_members.user_id', user.id)
          .order('name');
        if (error) throw error;
        setClubs((data || []) as Club[]);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load your groups');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-black dark:to-gray-900 pt-20 pb-20">
      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
              Your Groups <Users2 className="w-8 h-8 text-blue-500 fill-blue-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Stay connected with your communities
            </p>
          </div>
          <Button
            onClick={() => navigate('/clubs')}
            variant="outline"
            className="rounded-full border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Explore More
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading your communities...</p>
          </div>
        ) : clubs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl"
          >
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No groups yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Join clubs to unlock their group chats and start connecting!
            </p>
            <Button
              onClick={() => navigate('/clubs')}
              className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 shadow-lg shadow-blue-500/20 px-8"
            >
              Find Clubs
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {clubs.map((club, i) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/groups/${club.id}`)}
                  className="group relative bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-6 h-6 text-blue-500" />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {club.icon || '⭐'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                          {club.category}
                        </span>
                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active Now
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-8">
                        {club.name}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-4">
                        {club.description || 'No description available.'}
                      </p>

                      <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Group Chat
                      </div>
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
