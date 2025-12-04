/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users, Star, Search, Sparkles, Loader2, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
}

const CATEGORIES = ['All', 'Technology', 'Arts', 'Sports', 'Academic', 'Social'];

export default function Clubs() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
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
        console.error(e);
        toast.error('Failed to load clubs');
      } finally {
        setIsLoading(false);
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
        toast.success(`Left ${club.name}`);
      } else {
        // join
        const { error } = await sb
          .from('club_members')
          .upsert({ club_id: club.id, user_id: user.id }, { onConflict: 'club_id,user_id', ignoreDuplicates: true });
        if (error) throw error;
        const s = new Set(myClubIds);
        s.add(club.id);
        setMyClubIds(s);
        toast.success(`Joined ${club.name}! 🎉`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update club membership');
    } finally {
      setBusy(null);
    }
  };

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-950 dark:via-black dark:to-gray-900 pt-20 pb-20">
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent flex items-center gap-3">
              Explore Clubs <Sparkles className="w-8 h-8 text-violet-500 fill-violet-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Find your community and connect with like-minded people
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs..."
              className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-violet-100 dark:border-violet-900/30 focus:ring-violet-500 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading clubs...</p>
          </div>
        ) : filteredClubs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl"
          >
            <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-violet-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No clubs found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search or category filters.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredClubs.map((club, i) => {
                const isJoined = myClubIds.has(club.id);
                return (
                  <motion.div
                    key={club.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative bg-white dark:bg-gray-900 rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isJoined
                      ? 'border-violet-200 dark:border-violet-900/50 shadow-lg shadow-violet-500/5'
                      : 'border-gray-100 dark:border-gray-800 shadow-sm'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center text-2xl shadow-inner">
                        {club.icon || '⭐'}
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {club.category}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10">
                      {club.description || 'No description available.'}
                    </p>

                    <Button
                      onClick={() => toggleJoin(club)}
                      disabled={busy === club.id}
                      className={`w-full rounded-xl transition-all duration-300 ${isJoined
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-900/50'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-violet-600 dark:hover:bg-violet-400 hover:shadow-lg hover:shadow-violet-500/25'
                        }`}
                    >
                      {busy === club.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isJoined ? (
                        <>
                          <Check className="w-4 h-4 mr-2" /> Joined
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" /> Join Club
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
