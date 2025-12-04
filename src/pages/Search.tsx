import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { likeUser, type Candidate } from '@/lib/matching';
import { ThumbsUp, Sparkles, Search as SearchIcon, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ShinyText from '@/reactbits/ShinyText';
import SpotlightCard from '@/reactbits/SpotlightCard';
import StarBorder from '@/reactbits/StarBorder';
import PixelTrail from '@/reactbits/PixelTrail';
import ProfileDetailsDialog from '@/components/ProfileDetailsDialog';

export default function Search() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Candidate | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const normalized = useMemo(() => query.trim(), [query]);

  const load = async () => {
    if (!user) return;
    try {
      setLoadingResults(true);
      const sb: any = supabase as any;
      let q = sb
        .from('profiles')
        .select('user_id, full_name, college_name, branch, year_of_study, age, bio, interests, profile_image_url, is_verified')
        .neq('user_id', user.id)
        .eq('is_verified', true)
        .limit(50);

      if (normalized.length > 0) {
        // Search across name, branch, and college
        q = q.or(
          `full_name.ilike.%${normalized}%,branch.ilike.%${normalized}%,college_name.ilike.%${normalized}%`
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      setResults((data || []) as Candidate[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to search profiles';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLike = async (targetId: string) => {
    if (!user) return;
    try {
      const res = await likeUser(user.id, targetId);
      if (res.isMutual) {
        toast({ title: 'Connection Request Sent', description: 'Waiting for approval.' });
      } else {
        toast({ title: 'Connection Request Sent', description: 'Waiting for approval.' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to like user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-20">
      {/* PixelTrail Background */}
      <PixelTrail pixelSize={24} fadeDuration={800} pixelColor="rgba(59, 130, 246, 0.15)" />

      <div className="container mx-auto max-w-6xl p-6 relative z-10">
        <div className="mb-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-4xl font-extrabold">
              <ShinyText text="Explore & Connect" disabled={false} speed={3} className="inline-block" />
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto md:mx-0">
            Discover verified students across colleges. Search by name, branch, or interests.
          </p>
        </div>

        <div className="mb-12 max-w-3xl mx-auto md:mx-0">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1 group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, branch, college..."
                className="pl-12 h-14 text-lg rounded-2xl border-2 border-muted bg-background/50 backdrop-blur-sm focus:border-primary transition-all shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') load();
                }}
              />
            </div>
            <StarBorder as="button" className="cursor-pointer h-14 px-8" color="cyan" speed="3s" onClick={load} disabled={loadingResults}>
              <span className="flex items-center font-bold text-base">
                <Sparkles className="h-4 w-4 mr-2" /> Search
              </span>
            </StarBorder>
          </div>
        </div>

        {loadingResults && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingResults && results.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms to find more people.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((p, i) => (
            <motion.div
              key={p.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <SpotlightCard className="h-full bg-card/50 backdrop-blur-sm border-white/10" spotlightColor="rgba(139, 92, 246, 0.15)">
                <div className="p-0 h-full flex flex-col">
                  <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative group cursor-pointer" onClick={() => { setSelectedProfile(p); setShowProfile(true); }}>
                    {p.profile_image_url ? (
                      <img src={p.profile_image_url} alt={p.full_name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                        <span className="text-4xl">🎓</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {p.is_verified && (
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-bold backdrop-blur-md border border-green-500/20">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-1">
                      <h3 className="font-bold text-lg truncate">{p.full_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {p.branch || 'Student'} {p.college_name ? `• ${p.college_name}` : ''}
                      </p>
                    </div>

                    {p.interests && p.interests.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 mb-4">
                        {p.interests.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/10">
                            {tag}
                          </span>
                        ))}
                        {p.interests.length > 3 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
                            +{p.interests.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-xl" onClick={() => { setSelectedProfile(p); setShowProfile(true); }}>
                        <User className="h-4 w-4" />
                      </Button>
                      <Button className="flex-1 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={() => handleLike(p.user_id)}>
                        <ThumbsUp className="h-4 w-4 mr-2" /> Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>

      <ProfileDetailsDialog
        isOpen={showProfile}
        onOpenChange={setShowProfile}
        candidate={selectedProfile}
        onLike={() => selectedProfile && handleLike(selectedProfile.user_id)}
      />
    </div>
  );
}
