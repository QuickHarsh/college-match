import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Users, Heart, X, GraduationCap, MapPin, Info, Zap } from 'lucide-react';
import { fetchCandidates, likeUser, type Candidate } from '@/lib/matching';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import ProfileDetailsDialog from '@/components/ProfileDetailsDialog';

export default function Matching() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const current = candidates[index];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const [showProfile, setShowProfile] = useState(false);

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
      toast.error('Error', { description: msg });
    } finally {
      setLoadingCandidates(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleSkip = () => {
    if (index < candidates.length - 1) setIndex(index + 1);
    else toast.info('No more suggestions', { description: 'Check back later or join events!' });
  };

  const handleLike = async () => {
    if (!user || !current) return;
    try {
      const res = await likeUser(user.id, current.user_id);
      if (res.isMutual) {
        toast.success('It’s a match!', { description: 'Start a chat from the Messages tab!' });
        handleSkip();
      } else {
        toast.success('Like sent', { description: 'We’ll notify you if it’s a match.' });
        handleSkip();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to like user';
      toast.error('Error', { description: msg });
    }
  };



  // Calculate a simulated match score based on shared interests or random for demo
  const getMatchScore = (candidate: Candidate) => {
    // In a real app, this would be calculated by the backend
    return Math.floor(Math.random() * (99 - 75) + 75);
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4 flex flex-col items-center justify-center overflow-hidden">

      {/* Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm">
          <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
          <span className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Smart Matching Active
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-sm h-[600px]">
        <AnimatePresence mode="wait">
          {!current && !loadingCandidates && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
              <p className="text-muted-foreground mb-6">Check back later for new matches or explore events!</p>
              <Button onClick={() => load()} variant="outline" className="rounded-full">
                Refresh Suggestions
              </Button>
            </motion.div>
          )}

          {loadingCandidates && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-muted-foreground font-medium animate-pulse">Finding your best match...</p>
            </div>
          )}

          {current && (
            <motion.div
              key={current.user_id}
              className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
              style={{ x, rotate, scale }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_e, info) => {
                const velocity = info.velocity.x;
                const offset = info.offset.x;
                if (offset > 100 || velocity > 500) {
                  handleLike();
                } else if (offset < -100 || velocity < -500) {
                  handleSkip();
                }
              }}
            >
              <div className="relative w-full h-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800" onClick={() => setShowProfile(true)}>
                {/* Image / Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
                  {current.profile_image_url ? (
                    <img
                      src={current.profile_image_url}
                      alt={current.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <Users className="w-32 h-32" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <div className="relative w-4 h-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                      <circle className="text-white/20" strokeWidth="4" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                      <circle className="text-green-400" strokeWidth="4" strokeDasharray={60} strokeDashoffset={60 - (60 * (getMatchScore(current) / 100))} strokeLinecap="round" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-white">{getMatchScore(current)}% Match</span>
                </div>

                {/* Swipe Indicators */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 -rotate-12 border-4 border-green-500 rounded-xl px-4 py-2">
                  <span className="text-4xl font-bold text-green-500 uppercase tracking-wider">Like</span>
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 rotate-12 border-4 border-red-500 rounded-xl px-4 py-2">
                  <span className="text-4xl font-bold text-red-500 uppercase tracking-wider">Nope</span>
                </motion.div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-3">
                  <div>
                    <h2 className="text-3xl font-bold leading-tight flex items-end gap-2">
                      {current.full_name}
                      <span className="text-xl font-normal opacity-80">{current.age}</span>
                    </h2>
                    <div className="flex items-center gap-2 text-white/80 mt-1">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm font-medium">{current.branch || 'Student'}</span>
                      {current.college_name && (
                        <>
                          <span className="w-1 h-1 bg-white/50 rounded-full" />
                          <span className="text-sm truncate max-w-[150px]">{current.college_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {current.bio && (
                    <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                      {current.bio}
                    </p>
                  )}

                  {/* Interests */}
                  {current.interests && current.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {current.interests.slice(0, 3).map((interest) => (
                        <span key={interest} className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium">
                          {interest}
                        </span>
                      ))}
                      {current.interests.length > 3 && (
                        <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium">
                          +{current.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>





      <ProfileDetailsDialog
        isOpen={showProfile}
        onOpenChange={setShowProfile}
        candidate={current}
        onLike={handleLike}
      />
    </div>
  );
}
