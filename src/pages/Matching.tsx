import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Sparkles, Users, ThumbsUp, SkipForward } from 'lucide-react';
import { fetchCandidates, likeUser, type Candidate } from '@/lib/matching';
import { toast } from '@/hooks/use-toast';

export default function Matching() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const current = candidates[index];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const [matchCelebration, setMatchCelebration] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingCandidates(true);
      const list = await fetchCandidates(user.id, 25);
      setCandidates(list);
      setIndex(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load candidates';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoadingCandidates(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleSkip = () => {
    if (index < candidates.length - 1) setIndex(index + 1);
    else toast({ title: 'No more suggestions', description: 'Check back later or join events!' });
  };

  const handleLike = async () => {
    if (!user || !current) return;
    try {
      const res = await likeUser(user.id, current.user_id);
      if (res.isMutual) {
        setMatchCelebration(true);
        toast({ title: 'It’s a match!', description: 'Starting a video call...' });
        setTimeout(() => navigate('/match/video'), 800);
      } else {
        toast({ title: 'Like sent', description: 'We’ll notify you if it’s a match.' });
        handleSkip();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to like user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 flex items-center justify-center">
      <div className="container max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-10 w-10 text-primary fill-current" />
            <h1 className="text-3xl font-bold">Smart Matching</h1>
          </div>
          <p className="text-muted-foreground mt-2">We match you based on interests, branch, year, and quiz compatibility.</p>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-6">
              {!current && !loadingCandidates && (
                <div className="text-center">
                  <Users className="h-14 w-14 text-primary mb-4" />
                  <p className="text-lg">No candidates right now.</p>
                  <p className="text-sm text-muted-foreground">Try again later or join an event to meet people!</p>
                </div>
              )}

              {loadingCandidates && (
                <div className="text-center">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse mx-auto mb-3" />
                  <p className="text-muted-foreground">Finding great matches near you...</p>
                </div>
              )}

              {current && (
                <motion.div
                  key={current.user_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full relative select-none"
                >
                  {/* Swipe Card */}
                  <motion.div
                    drag="x"
                    style={{ x, rotate }}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.8}
                    onDragEnd={(_e, info) => {
                      const velocity = info.velocity.x;
                      const offset = info.offset.x;
                      if (offset > 120 || velocity > 800) {
                        // Like
                        handleLike();
                        x.set(0);
                      } else if (offset < -120 || velocity < -800) {
                        // Skip
                        handleSkip();
                        x.set(0);
                      } else {
                        x.set(0);
                      }
                    }}
                    className="bg-card border rounded-xl p-5 shadow-lg"
                  >
                    {/* Overlays */}
                    <motion.div style={{ opacity: likeOpacity }} className="absolute left-3 top-3 px-3 py-1 rounded-md bg-green-500 text-white text-sm font-semibold">
                      LIKE
                    </motion.div>
                    <motion.div style={{ opacity: nopeOpacity }} className="absolute right-3 top-3 px-3 py-1 rounded-md bg-red-500 text-white text-sm font-semibold">
                      NOPE
                    </motion.div>
                  <div className="text-left max-w-xl mx-auto">
                    <h3 className="text-2xl font-semibold">{current.full_name}</h3>
                    <p className="text-muted-foreground">
                      {current.age ? `${current.age} • ` : ''}
                      {current.branch || 'Student'}
                      {current.college_name ? ` • ${current.college_name}` : ''}
                    </p>
                    {current.bio && <p className="mt-3">{current.bio}</p>}
                    {current.interests && current.interests.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {current.interests.slice(0, 8).map((i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-sm bg-primary/10">
                            {i}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <Button size="lg" variant="outline" onClick={handleSkip}>
                      <SkipForward className="h-4 w-4 mr-2" /> Skip
                    </Button>
                    <Button size="lg" onClick={handleLike}>
                      <ThumbsUp className="h-4 w-4 mr-2" /> Like (−1 coin)
                    </Button>
                  </div>
                  </motion.div>

                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Match Celebration */}
        <AnimatePresence>
          {matchCelebration && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                className="bg-card border rounded-2xl p-8 text-center shadow-xl">
                <Heart className="h-12 w-12 text-primary fill-current mx-auto mb-2" />
                <div className="text-xl font-bold mb-1">It’s a Match!</div>
                <div className="text-sm text-muted-foreground">Connecting you to a video call...</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
