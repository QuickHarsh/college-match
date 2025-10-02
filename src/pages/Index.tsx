/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Award, MessageCircle, Sparkles, ThumbsUp, GraduationCap, Shield, ArrowRight, Flame, Crown } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import CarouselHero, { type Slide } from '@/components/CarouselHero';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ShinyText from '@/reactbits/ShinyText';
import AnimatedContent from '@/reactbits/AnimatedContent';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { isComplete, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLHeadingElement | null>(null);

  // This dashboard is now public. If not logged in, we show CTA banners and gate actions.

  // Dynamic slides from Supabase (upcoming events + top clubs)
  const [slides, setSlides] = useState<Slide[] | null>(null);
  // Announcements banner
  const [announcement, setAnnouncement] = useState<string | null>(null);
  // Suggested profiles (same college vibe)
  const [suggested, setSuggested] = useState<Array<{ id: string; full_name: string | null; profile_image_url: string | null; bio?: string | null }>>([]);
  // Today in campus (events + clubs)
  const [todayEvents, setTodayEvents] = useState<Array<{ id: string; title: string; start_time?: string | null; banner_image_url?: string | null }>>([]);
  const [trendingClubs, setTrendingClubs] = useState<Array<{ id: string; name: string; description?: string | null }>>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const sb: any = supabase as any;
        // Upcoming events: starting soon
        const { data: ev, error: eErr } = await sb
          .from('events')
          .select('id, title, description, banner_image_url, start_time')
          .gt('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(2);
        if (eErr) throw eErr;

        // Top club (fallback to any club if no ranking)
        const { data: clubs, error: cErr } = await sb
          .from('interest_clubs')
          .select('id, name, description, icon, category')
          .order('name')
          .limit(1);
        if (cErr) throw cErr;

        const dynamicSlides: Slide[] = [];
        (ev || []).forEach((row: { id: string; title: string; description: string | null; banner_image_url: string | null }) => {
          dynamicSlides.push({
            id: `event-${row.id}`,
            tag: 'Upcoming Event',
            title: row.title || 'Campus Event',
            subtitle: row.description || 'Happening soon — don’t miss out!',
            cta: 'View event',
            to: '/events',
            imageUrl: row.banner_image_url || undefined,
          });
        });
        if ((clubs || []).length > 0) {
          const c = clubs[0] as { id: string; name: string; description: string | null };
          dynamicSlides.push({
            id: `club-${c.id}`,
            tag: 'Top Club',
            title: c.name,
            subtitle: c.description || 'Meet people who love what you love.',
            cta: 'Explore clubs',
            to: '/clubs',
            imageUrl: undefined,
            accent: 'from-primary/20 to-secondary/20',
          });
        }

        // Fallback to static slides if dynamic empty
        if (dynamicSlides.length === 0) {
          const fallback: Slide[] = [
            {
              id: 'garba',
              tag: 'Upcoming Event',
              title: 'Garba Night 2025',
              subtitle: 'Dress up, dance, and meet new people from every branch. Limited passes available! ',
              cta: 'View event',
              to: '/events',
              imageUrl: 'https://images.unsplash.com/photo-1544515919-1f0a2776c0d3?q=80&w=1400&auto=format&fit=crop',
            },
            {
              id: 'freshers',
              tag: 'Don’t Miss',
              title: 'Freshers Party Bash',
              subtitle: 'Kickstart your year with music, games, and great vibes. Make your first connections!',
              cta: 'See details',
              to: '/events',
              imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1400&auto=format&fit=crop',
            },
            {
              id: 'clubs',
              tag: 'Top Clubs',
              title: 'Anime, Tech, Fitness & Music',
              subtitle: 'Join trending clubs to meet people who love what you love. New members welcome!',
              cta: 'Explore clubs',
              to: '/clubs',
              imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400&auto=format&fit=crop',
            },
          ];
          setSlides(fallback);
        } else {
          setSlides(dynamicSlides);
        }
      } catch (_e) {
        // Soft-fallback to static set on error
        const fallback: Slide[] = [
          {
            id: 'garba',
            tag: 'Upcoming Event',
            title: 'Garba Night 2025',
            subtitle: 'Dress up, dance, and meet new people from every branch. Limited passes available! ',
            cta: 'View event',
            to: '/events',
            imageUrl: 'https://images.unsplash.com/photo-1544515919-1f0a2776c0d3?q=80&w=1400&auto=format&fit=crop',
          },
          {
            id: 'freshers',
            tag: 'Don’t Miss',
            title: 'Freshers Party Bash',
            subtitle: 'Kickstart your year with music, games, and great vibes. Make your first connections!',
            cta: 'See details',
            to: '/events',
            imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1400&auto=format&fit=crop',
          },
          {
            id: 'clubs',
            tag: 'Top Clubs',
            title: 'Anime, Tech, Fitness & Music',
            subtitle: 'Join trending clubs to meet people who love what you love. New members welcome!',
            cta: 'Explore clubs',
            to: '/clubs',
            imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400&auto=format&fit=crop',
          },
        ];
        setSlides(fallback);
      }
    };
    load();
  }, []);

  // Load additional dashboard data (announcements, suggestions, events/clubs lists)
  useEffect(() => {
    const loadExtras = async () => {
      try {
        const sb: any = supabase as any;
        // Announcements (optional table). We show the latest active one.
        try {
          const { data: ann } = await sb
            .from('announcements')
            .select('message, active')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(1);
          if (ann && ann.length > 0) setAnnouncement(ann[0].message as string);
        } catch (_ignored) {
          setAnnouncement(null);
        }

        // Suggested profiles (exclude self). Keep simple and safe.
        try {
          const { data: profs } = await sb
            .from('profiles')
            .select('id, full_name, profile_image_url, bio')
            .neq('id', sb.auth.getUser?.()?.id || '00000000-0000-0000-0000-000000000000')
            .limit(6);
          if (Array.isArray(profs)) setSuggested(profs as any);
        } catch (_ignored) {
          setSuggested([]);
        }

        // Today events (today only if column exists; else use soonest 3)
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
        } catch (_ignored) {
          setTodayEvents([]);
        }

        // Trending clubs (simple order)
        try {
          const { data: cl } = await sb
            .from('interest_clubs')
            .select('id, name, description')
            .order('name', { ascending: true })
            .limit(5);
          setTrendingClubs((cl || []) as any);
        } catch (_ignored) {
          setTrendingClubs([]);
        }
      } catch (_e) {
        // Ignore, keep fallbacks empty
      }
    };
    loadExtras();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Main Content (TopNav handles header) */}
      <main className="container mx-auto px-4 pt-6 pb-24">
        <div className="text-center mb-8 md:mb-10">
          <motion.h2
            ref={heroRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-4xl md:text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
          >
            <ShinyText text="Welcome to CollegeMatch" disabled={false} speed={3.2} className="inline-block" />
          </motion.h2>
          <AnimatedContent distance={16} duration={0.6}>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover people, join clubs, attend campus events, and find meaningful connections.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button size="sm" className="md:size-default" onClick={() => handleProtectedNav('/match')}>
                Start Matching <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="sm" variant="secondary" className="md:size-default" onClick={() => handleProtectedNav('/search')}>
                Explore Search
              </Button>
            </div>
          </AnimatedContent>
        </div>

        {/* Featured Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-5xl mx-auto mb-10"
        >
          {slides && <CarouselHero slides={slides} />}
        </motion.div>

        {/* Announcements banner (admin broadcast) */}
        {announcement && (
          <div className="mb-8 rounded-lg border p-4 md:p-5 bg-secondary/10 flex items-center justify-between">
            <div className="text-left">
              <div className="font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Announcement</div>
              <div className="text-sm text-muted-foreground">{announcement}</div>
            </div>
          </div>
        )}

        {/* Auth / Setup banners */}
        {!user && (
          <div className="mb-8 rounded-lg border p-4 bg-primary/5 flex items-center justify-between">
            <div className="text-left">
              <div className="font-semibold">Sign up with your college email</div>
              <div className="text-sm text-muted-foreground">It’s free and takes less than 1 minute.</div>
            </div>
            <Button size="sm" onClick={() => navigate('/auth')}>
              Get started <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
        {user && !isComplete && (
          <div className="mb-8 rounded-lg border p-4 bg-yellow-500/10 flex items-center justify-between">
            <div className="text-left">
              <div className="font-semibold">Complete your profile</div>
              <div className="text-sm text-muted-foreground">Add your details to unlock matching and chat.</div>
            </div>
            <Button size="sm" onClick={() => navigate('/setup')}>Complete setup</Button>
          </div>
        )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10">
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <Card className="cursor-pointer" onClick={() => handleProtectedNav('/match')}>
            <CardContent className="p-6 text-center">
              <Users className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="font-semibold">Start Matching</div>
              <div className="text-sm text-muted-foreground">Swipe and find people like you</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <Card className="cursor-pointer" onClick={() => handleProtectedNav('/likes')}>
            <CardContent className="p-6 text-center">
              <ThumbsUp className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="font-semibold">Who liked you</div>
              <div className="text-sm text-muted-foreground">Like back to match</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <Card className="cursor-pointer" onClick={() => handleProtectedNav('/chats')}>
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="font-semibold">Chats</div>
              <div className="text-sm text-muted-foreground">Message your matches</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Matches at Your College */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Matches at your college</h3>
          <Button variant="ghost" size="sm" onClick={() => handleProtectedNav('/match')}>See all</Button>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suggested.length === 0 && (
            <div className="text-sm text-muted-foreground">No suggestions yet. Complete your profile to get better matches.</div>
          )}
          {suggested.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              whileHover={{ y: -3 }} className="rounded-lg border bg-card overflow-hidden">
              <div className="h-36 w-full bg-muted overflow-hidden">
                {p.profile_image_url ? (
                  <img src={p.profile_image_url} alt={p.full_name || 'Student'} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">No photo</div>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium truncate">{p.full_name || 'Student'}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{p.bio || 'Say hi and break the ice!'}</div>
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={() => handleProtectedNav('/match')}>View</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Today in Campus: Events + Clubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Today in Campus</h3>
              </div>
              <div className="grid gap-3">
                {todayEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No events today. Check upcoming events!</p>
                )}
                {todayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="h-12 w-16 bg-muted overflow-hidden rounded">
                      {e.banner_image_url ? (
                        <img src={e.banner_image_url} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Event</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{e.title}</div>
                      {e.start_time && (
                        <div className="text-xs text-muted-foreground">{new Date(e.start_time).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4"><Button variant="secondary" onClick={() => handleProtectedNav('/events')}>Browse events</Button></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Trending Clubs</h3>
              </div>
              <div className="grid gap-2">
                {trendingClubs.length === 0 && (
                  <p className="text-sm text-muted-foreground">Clubs will appear here. Be the first to join!</p>
                )}
                {trendingClubs.map((c) => (
                  <div key={c.id} className="rounded border px-3 py-2">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{c.description || 'Meet people who love what you love.'}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4"><Button onClick={() => handleProtectedNav('/clubs')}>Explore clubs</Button></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Streaks & Challenges + Leaderboard */}
      <div className="mt-12 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="p-6 bg-card rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Streaks & Challenges</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Keep your streak alive and unlock badges.</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm"><span>Daily Login</span><span>3/7</span></div>
                <div className="h-2 bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: '42%' }} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm"><span>Say Hi to 3 people</span><span>2/3</span></div>
                <div className="h-2 bg-muted rounded overflow-hidden"><div className="h-full bg-secondary" style={{ width: '66%' }} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm"><span>Join 1 club</span><span>0/1</span></div>
                <div className="h-2 bg-muted rounded overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '0%' }} /></div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => handleProtectedNav('/quiz')}>Take compatibility quiz</Button>
              <Button onClick={() => handleProtectedNav('/events')}>Find an event</Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }} className="p-6 bg-card rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Leaderboard (Top Connectors)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Weekly top students by badges and chats.</p>
            <div className="space-y-3">
              {[0,1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">Student {i + 1}</div>
                    <div className="text-xs text-muted-foreground">Badges: {5 - i} • Chats: {12 + i}</div>
                  </div>
                  <div className="text-xs">#{i + 1}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Safety & Community */}
      <div className="text-center mt-12 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center p-6 bg-card rounded-lg border">
            <Users className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Smart Matching</h3>
            <p className="text-sm text-muted-foreground">Interests, branch, year, and compatibility quiz.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }} className="text-center p-6 bg-card rounded-lg border">
            <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">College-only</h3>
            <p className="text-sm text-muted-foreground">Exclusive access via college email verification.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="text-center p-6 bg-card rounded-lg border">
            <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Safety first</h3>
            <p className="text-sm text-muted-foreground">Block/report and hide profile options built-in.</p>
          </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
