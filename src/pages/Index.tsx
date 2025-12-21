/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, Calendar, MessageCircle, Sparkles, ThumbsUp, GraduationCap, Shield, ArrowRight, Flame, Crown } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import CarouselHero, { type Slide } from '@/components/CarouselHero';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import ShinyText from '@/reactbits/ShinyText';
import BlurText from '@/reactbits/BlurText';
import AnimatedContent from '@/reactbits/AnimatedContent';
import TiltedCard from '@/reactbits/TiltedCard';
import SpotlightCard from '@/reactbits/SpotlightCard';
import MagnetLines from '@/reactbits/MagnetLines';
import StarBorder from '@/reactbits/StarBorder';
import MatchStack from '@/reactbits/MatchStack';
import CircularGallery from '@/reactbits/CircularGallery';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { isComplete, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLHeadingElement | null>(null);

  // Dynamic slides from Supabase (upcoming events + top clubs)
  const [slides, setSlides] = useState<Slide[] | null>(null);
  // Announcements banner
  const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string }>>([]);
  // Suggested profiles (same college vibe)
  const [suggested, setSuggested] = useState<Array<{ id: string; full_name: string | null; profile_image_url: string | null; bio?: string | null }>>([]);
  // Today in campus (events + clubs)
  const [todayEvents, setTodayEvents] = useState<Array<{ id: string; title: string; start_time?: string | null; banner_image_url?: string | null }>>([]);
  const [trendingClubs, setTrendingClubs] = useState<Array<{ id: string; name: string; description?: string | null }>>([]);
  // Leaderboard Preview
  const [leaderboardPreview, setLeaderboardPreview] = useState<Array<{ user_id: string; full_name: string; match_count: number; profile_image_url: string | null }>>([]);
  // User Stats
  const [userStats, setUserStats] = useState<{ matches: number; likes: number }>({ matches: 0, likes: 0 });

  // Announcement rotation
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements]);

  useEffect(() => {
    const load = async () => {
      try {
        const sb: any = supabase as any;
        // Upcoming events: starting soon (prioritize hot events)
        const { data: ev, error: eErr } = await sb
          .from('events')
          .select('id, title, description, banner_image_url, start_time, is_hot')
          .gt('start_time', new Date().toISOString())
          .order('is_hot', { ascending: false }) // Hot events first
          .order('start_time', { ascending: true })
          .limit(3);
        if (eErr) throw eErr;

        // Top club (fallback to any club if no ranking)
        const { data: clubs, error: cErr } = await sb
          .from('interest_clubs')
          .select('id, name, description, icon, banner_image_url, category')
          .order('name')
          .limit(1);
        if (cErr) throw cErr;

        const dynamicSlides: Slide[] = [];
        (ev || []).forEach((row: { id: string; title: string; description: string | null; banner_image_url: string | null; is_hot: boolean }) => {
          dynamicSlides.push({
            id: `event-${row.id}`,
            tag: row.is_hot ? '🔥 Hot Event' : 'Upcoming Event',
            title: row.title || 'Campus Event',
            subtitle: row.description || 'Happening soon — don’t miss out!',
            cta: 'View event',
            to: '/events',
            imageUrl: row.banner_image_url || undefined,
            accent: row.is_hot ? 'from-orange-500/60 to-red-600/60' : undefined,
          });
        });
        if ((clubs || []).length > 0) {
          const c = clubs[0] as { id: string; name: string; description: string | null; banner_image_url: string | null };
          dynamicSlides.push({
            id: `club-${c.id}`,
            tag: 'Top Club',
            title: c.name,
            subtitle: c.description || 'Meet people who love what you love.',
            cta: 'Explore clubs',
            to: '/clubs',
            imageUrl: c.banner_image_url || undefined,
            accent: 'from-primary/20 to-secondary/20',
          });
        }

        // Fallback to static welcome slide if dynamic empty
        if (dynamicSlides.length === 0) {
          const fallback: Slide[] = [
            {
              id: 'welcome',
              tag: 'Welcome',
              title: 'Welcome to KeenQ',
              subtitle: 'Your campus community awaits. Explore events, clubs, and meet new people.',
              cta: 'Get Started',
              to: '/match',
              imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1400&auto=format&fit=crop',
            }
          ];
          setSlides(fallback);
        } else {
          setSlides(dynamicSlides);
        }
      } catch (_e) {
        // Soft-fallback to static welcome on error
        const fallback: Slide[] = [
          {
            id: 'welcome',
            tag: 'Welcome',
            title: 'Welcome to KeenQ',
            subtitle: 'Your campus community awaits. Explore events, clubs, and meet new people.',
            cta: 'Get Started',
            to: '/match',
            imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1400&auto=format&fit=crop',
          }
        ];
        setSlides(fallback);
      }
    };
    load();
  }, []);

  // Load additional dashboard data (announcements, suggestions, events/clubs lists, leaderboard, stats)
  useEffect(() => {
    const loadExtras = async () => {
      try {
        const sb: any = supabase as any;
        const currentUserId = sb.auth.getUser?.()?.id;

        // Announcements
        try {
          const { data: ann } = await sb
            .from('announcements')
            .select('id, message, active')
            .eq('active', true)
            .order('created_at', { ascending: false });
          if (ann) setAnnouncements(ann as any);
        } catch (_ignored) { setAnnouncements([]); }

        // Suggested profiles
        try {
          const { data: profs } = await sb
            .from('profiles')
            .select('id, full_name, profile_image_url, bio')
            .neq('id', currentUserId || '00000000-0000-0000-0000-000000000000')
            .limit(8);
          if (Array.isArray(profs)) setSuggested(profs as any);
        } catch (_ignored) { setSuggested([]); }

        // Today events
        try {
          const now = new Date();
          const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const { data: evs } = await sb
            .from('events')
            .select('id, title, start_time, banner_image_url')
            .gt('start_time', now.toISOString())
            .lt('start_time', nextDay.toISOString())
            .order('start_time', { ascending: true })
            .limit(3);
          if (Array.isArray(evs) && evs.length > 0) setTodayEvents(evs as any);
          else {
            const { data: soon } = await sb
              .from('events')
              .select('id, title, start_time, banner_image_url')
              .gt('start_time', now.toISOString())
              .order('start_time', { ascending: true })
              .limit(3);
            setTodayEvents((soon || []) as any);
          }
        } catch (_ignored) { setTodayEvents([]); }

        // Trending clubs
        try {
          const { data: cl } = await sb
            .from('interest_clubs')
            .select('id, name, description')
            .order('name', { ascending: true })
            .limit(5);
          setTrendingClubs((cl || []) as any);
        } catch (_ignored) { setTrendingClubs([]); }

        // Leaderboard Preview
        try {
          const { data: matches } = await sb.from('matches').select('user1_id, user2_id').eq('is_mutual', true);
          const counts: Record<string, number> = {};
          matches?.forEach((m: any) => {
            counts[m.user1_id] = (counts[m.user1_id] || 0) + 1;
            counts[m.user2_id] = (counts[m.user2_id] || 0) + 1;
          });
          const sortedIds = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);
          if (sortedIds.length > 0) {
            const { data: profiles } = await sb.from('profiles').select('user_id, full_name, profile_image_url').in('user_id', sortedIds);
            const pMap = new Map(profiles?.map((p: any) => [p.user_id, p]));
            const preview = sortedIds.map(id => {
              const p: any = pMap.get(id);
              return p ? { user_id: id, full_name: p.full_name, match_count: counts[id], profile_image_url: p.profile_image_url } : null;
            }).filter(Boolean);
            setLeaderboardPreview(preview as any);
          }
        } catch (_ignored) { setLeaderboardPreview([]); }

        // User Stats
        if (currentUserId) {
          try {
            const { count: matchCount } = await sb.from('matches').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`).eq('is_mutual', true);
            const { count: likeCount } = await sb.from('likes').select('id', { count: 'exact', head: true }).eq('liked_id', currentUserId);
            setUserStats({ matches: matchCount || 0, likes: likeCount || 0 });
          } catch (_ignored) { /* ignore */ }
        }

      } catch (_e) {
        // Ignore
      }
    };
    loadExtras();
  }, [user]);

  // Subtle GSAP entrance on the hero heading once slides are ready
  useEffect(() => {
    if (!slides || !heroRef.current) return;
    gsap.from(heroRef.current, { opacity: 0, y: 12, duration: 0.6, ease: 'power2.out' });
  }, [slides]);

  if (loading || profileLoading || !slides) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          {/* Placeholder for logo (intentionally empty). Replace with your custom logo when ready. */}
          <div className="h-8 w-8 mx-auto mb-4" aria-hidden />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleProtectedNav = (path: string) => {
    if (!user) {
      navigate('/auth');
    } else if (!isComplete && path !== '/setup') {
      navigate('/setup');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* MagnetLines Background - Tuned for visibility */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <MagnetLines
          rows={12}
          columns={12}
          containerSize="100%"
          lineColor="rgba(124, 58, 237, 0.3)"
          lineWidth="2px"
          lineHeight="30px"
          baseAngle={0}
        />
      </div>

      {/* Main Content (TopNav handles header) */}
      <main className="container mx-auto px-4 pt-24 pb-24 relative z-10">

        {/* Hero Section with Split Layout */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-20 mt-12">
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h2 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                <BlurText
                  text="Find Your Vibe"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="inline-block text-foreground mb-0"
                />
                <span className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 block mt-2">
                  at KeenQ
                </span>
              </h2>
            </motion.div>
            <AnimatedContent distance={16} duration={0.6}>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto md:mx-0 mb-10 leading-relaxed">
                Discover people, join clubs, and find meaningful connections in a community built just for you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-6">
                <StarBorder as="button" className="cursor-pointer" color="cyan" speed="4s" onClick={() => handleProtectedNav('/match')}>
                  <span className="font-bold text-lg px-6 py-1">Start Matching 💘</span>
                </StarBorder>
                <Button variant="ghost" size="lg" className="text-lg" onClick={() => handleProtectedNav('/search')}>
                  Explore Search <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </AnimatedContent>
          </div>

          {/* Match Stack Teaser - Replaced with Circular Gallery for "Best Unique" feel if enough matches, else MatchStack */}
          <div className="hidden md:flex justify-center items-center h-full min-h-[400px]">
            {suggested.length >= 4 ? (
              <div className="w-full h-[400px] flex items-center justify-center scale-90">
                <CircularGallery
                  items={suggested.map((p) => (
                    <div key={p.id} className="w-[180px] h-[260px] bg-card rounded-xl border shadow-xl overflow-hidden relative group cursor-pointer" onClick={() => handleProtectedNav('/match')}>
                      {p.profile_image_url ? (
                        <img src={p.profile_image_url} alt={p.full_name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No Photo</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <div className="text-white font-bold">{p.full_name}</div>
                        <div className="text-white/80 text-xs line-clamp-1">{p.bio}</div>
                      </div>
                    </div>
                  ))}
                  bend={2}
                  textColor="#ffffff"
                  borderRadius={0.05}
                />
              </div>
            ) : (
              <MatchStack />
            )}
          </div>
        </div>

        {/* Featured Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-6xl mx-auto mb-20"
        >
          {slides && <CarouselHero slides={slides} />}
        </motion.div>

        {/* Announcements banner (admin broadcast) */}
        {announcements.length > 0 && (
          <div className="mb-8 max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 p-1">
              <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm" />
              <div className="relative flex items-center gap-4 p-3 md:p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg">
                  <Crown className="h-5 w-5 animate-pulse" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="relative h-6 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={index} // We need an index state for rotation
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center"
                      >
                        <span className="font-medium text-foreground md:text-lg truncate">
                          {announcements[index]?.message}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                {announcements.length > 1 && (
                  <div className="flex gap-1">
                    {announcements.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-primary' : 'bg-primary/20'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions with TiltedCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          <div onClick={() => handleProtectedNav('/match')} className="cursor-pointer">
            <TiltedCard
              containerHeight="240px"
              captionText="Swipe & Match"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm">
                  <Users className="h-14 w-14 text-primary mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Start Matching</h3>
                  <p className="text-base text-muted-foreground mt-2">Find your vibe</p>
                </div>
              }
            >
              <div className="w-full h-full bg-white dark:bg-gray-900" />
            </TiltedCard>
          </div>

          <div onClick={() => handleProtectedNav('/likes')} className="cursor-pointer">
            <TiltedCard
              containerHeight="240px"
              captionText="See who likes you"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
                  <ThumbsUp className="h-14 w-14 text-blue-500 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Who Liked You</h3>
                  <p className="text-base text-muted-foreground mt-2">Check your admirers</p>
                </div>
              }
            >
              <div className="w-full h-full bg-white dark:bg-gray-900" />
            </TiltedCard>
          </div>

          <div onClick={() => handleProtectedNav('/chats')} className="cursor-pointer">
            <TiltedCard
              containerHeight="240px"
              captionText="Your conversations"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
                  <MessageCircle className="h-14 w-14 text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h3>
                  <p className="text-base text-muted-foreground mt-2">Stay connected</p>
                </div>
              }
            >
              <div className="w-full h-full bg-white dark:bg-gray-900" />
            </TiltedCard>
          </div>
        </div>

        {/* Today in Campus: Events + Clubs with SpotlightCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-20">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <SpotlightCard className="h-full bg-white dark:bg-gray-900" spotlightColor="rgba(124, 58, 237, 0.15)">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-2xl">
                    <Calendar className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl">Today in Campus</h3>
                    <p className="text-muted-foreground">What's happening now</p>
                  </div>
                </div>
                <div className="grid gap-5">
                  {todayEvents.length === 0 && (
                    <p className="text-sm text-muted-foreground">No events today. Check upcoming events!</p>
                  )}
                  {todayEvents.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 cursor-pointer" onClick={() => handleProtectedNav('/events')}>
                      <div className="h-16 w-24 bg-muted overflow-hidden rounded-lg flex-shrink-0 shadow-sm">
                        {e.banner_image_url ? (
                          <img src={e.banner_image_url} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Event</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-semibold truncate">{e.title}</div>
                        {e.start_time && (
                          <div className="text-sm text-muted-foreground font-medium">{new Date(e.start_time).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10"><Button variant="secondary" className="w-full rounded-full h-12 text-base" onClick={() => handleProtectedNav('/events')}>Browse events</Button></div>
              </div>
            </SpotlightCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <SpotlightCard className="h-full bg-white dark:bg-gray-900" spotlightColor="rgba(236, 72, 153, 0.15)">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-2xl">
                    <Sparkles className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl">Trending Clubs</h3>
                    <p className="text-muted-foreground">Communities you might like</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  {trendingClubs.length === 0 && (
                    <p className="text-sm text-muted-foreground">Clubs will appear here. Be the first to join!</p>
                  )}
                  {trendingClubs.map((c) => (
                    <div key={c.id} className="rounded-xl border border-gray-100 dark:border-gray-800 px-6 py-4 hover:border-pink-200 dark:hover:border-pink-900 transition-colors bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer" onClick={() => handleProtectedNav('/clubs')}>
                      <div className="text-lg font-semibold">{c.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1 mt-1">{c.description || 'Meet people who love what you love.'}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-10"><Button className="w-full bg-pink-600 hover:bg-pink-700 rounded-full h-12 text-base" onClick={() => handleProtectedNav('/clubs')}>Explore clubs</Button></div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>

        {/* Stats & Leaderboard Preview */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <SpotlightCard className="h-full bg-card/50 backdrop-blur-sm border-white/10" spotlightColor="rgba(59, 130, 246, 0.15)">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Flame className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Your Stats</h3>
                      <p className="text-sm text-muted-foreground">Your campus impact</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                      <div className="text-3xl font-black text-primary mb-1">{userStats.matches}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Matches</div>
                    </div>
                    <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                      <div className="text-3xl font-black text-pink-500 mb-1">{userStats.likes}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full rounded-full" onClick={() => handleProtectedNav('/match')}>
                      Find more matches
                    </Button>
                    <Button variant="outline" className="w-full rounded-full" onClick={() => handleProtectedNav('/likes')}>
                      See who likes you
                    </Button>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}>
              <SpotlightCard className="h-full bg-card/50 backdrop-blur-sm border-white/10" spotlightColor="rgba(234, 179, 8, 0.15)">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-yellow-500/10 rounded-xl">
                        <Crown className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">Leaderboard</h3>
                        <p className="text-sm text-muted-foreground">Top students this week</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" onClick={() => handleProtectedNav('/leaderboard')}>
                      View All
                    </Button>
                  </div>

                  <div className="space-y-3 mb-6">
                    {leaderboardPreview.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No rankings yet. Be the first!</p>
                    )}
                    {leaderboardPreview.map((u, i) => (
                      <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleProtectedNav('/leaderboard')}>
                        <div className={`w-6 text-center font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                          #{i + 1}
                        </div>
                        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          <img src={u.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`} className="w-full h-full object-cover" alt={u.full_name} />
                        </div>
                        <div className="flex-1 min-w-0 font-medium truncate text-sm">
                          {u.full_name}
                        </div>
                        <div className="text-xs font-bold bg-secondary px-2 py-1 rounded-full">
                          {u.match_count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>

        {/* Safety & Community */}
        <div className="text-center mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center p-8 bg-card/50 backdrop-blur-sm rounded-2xl border">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Smart Matching</h3>
              <p className="text-sm text-muted-foreground">Interests, branch, year, and compatibility quiz.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }} className="text-center p-8 bg-card/50 backdrop-blur-sm rounded-2xl border">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">College-only</h3>
              <p className="text-sm text-muted-foreground">Exclusive access via college email verification.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="text-center p-8 bg-card/50 backdrop-blur-sm rounded-2xl border">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Safety first</h3>
              <p className="text-sm text-muted-foreground">Block/report and hide profile options built-in.</p>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

