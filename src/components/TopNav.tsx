/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, ThumbsUp, MessageCircle, Calendar, Users2, Home, Search as SearchIcon, Menu, X } from 'lucide-react';
import { ComponentType, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfile } from '@/hooks/useProfile';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';

export default function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [likesCount, setLikesCount] = useState<number>(0);
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const loadCounts = async () => {
      if (!user) { setLikesCount(0); setConnectionsCount(0); return; }
      try {
        const sb: any = supabase as any;
        // Load raw liker ids
        const { data: likesRows, error: lErr } = await sb
          .from('likes')
          .select('liker_id')
          .eq('liked_id', user.id);
        let likerIds: string[] = ((likesRows || []) as Array<{ liker_id: string }>).map((r: any) => r.liker_id);
        // Exclude those already connected (mutual matches)
        if (likerIds.length > 0) {
          const list = likerIds.join(',');
          const { data: mutuals, error: m1 } = await sb
            .from('matches')
            .select('user1_id, user2_id, is_mutual')
            .eq('is_mutual', true)
            .or(`and(user1_id.eq.${user.id},user2_id.in.(${list})),and(user2_id.eq.${user.id},user1_id.in.(${list}))`);
        
          if (m1) throw m1;
          const connected = new Set<string>((mutuals || []).map((m: any) => (m.user1_id === user.id ? m.user2_id : m.user1_id)));
          likerIds = likerIds.filter(id => !connected.has(id));
        }
        setLikesCount(likerIds.length);

        const { count: connCountExact, error: mErr } = await sb
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_mutual', true);
        if (mErr) throw mErr;
        setConnectionsCount(connCountExact || 0);
      } catch {
        // ignore counts on error
      }
    };
    loadCounts();
  }, [user]);
  const GuardedLink = ({ to, label, icon: Icon, badge }: { to: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number }) => (
    <button
      onClick={() => {
        if (!user) navigate('/auth');
        else navigate(to);
      }}
      className="relative inline-flex items-center gap-1 px-3 py-2 rounded-md hover:bg-accent text-sm"
    >
      <Icon className="h-4 w-4" /> {label}
      {badge && badge > 0 ? (
        <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Placeholder for logo (intentionally empty). Replace with your custom logo when ready. */}
          <div className="h-6 w-6" aria-hidden />
          <button onClick={() => navigate('/')} className="font-semibold">CollegeMatch</button>
        </div>
        {/* Desktop links only */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" className="group relative inline-flex items-center gap-1 px-3 py-2 rounded-md hover:bg-accent text-sm">
            <Home className="h-4 w-4" /> Home
            <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </NavLink>
          <GuardedLink to="/match" label="Match" icon={Users} />
          <GuardedLink to="/search" label="Search" icon={SearchIcon} />
          <GuardedLink to="/likes" label="Likes" icon={ThumbsUp} badge={likesCount} />
          <GuardedLink to="/connections" label="Connections" icon={Users2} badge={connectionsCount} />
          <GuardedLink to="/chats" label="Chats" icon={MessageCircle} />
          <GuardedLink to="/events" label="Events" icon={Calendar} />
          <GuardedLink to="/clubs" label="Clubs" icon={Users2} />
          <GuardedLink to="/groups" label="Groups" icon={Users2} />
          <NavLink to="/about" className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:bg-accent text-sm">About</NavLink>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!user ? (
            <Button size="sm" onClick={() => navigate('/auth')}>Log in</Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-accent">
                  <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {profile?.profile_image_url ? (
                      <img src={profile.profile_image_url} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs">
                        {profile?.full_name ? profile.full_name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm max-w-[120px] truncate">{profile?.full_name || 'Student'}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/setup')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/likes')}>Likes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/connections')}>Connections</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/chats')}>Chats</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/wallet')}>Wallet</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/quiz')}>Compatibility Quiz</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/about')}>About</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {/* Mobile collapsible menu removed; use bottom tab bar for navigation */}

      {/* Bottom Tab Bar (mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid grid-cols-5">
          <button
            className="flex flex-col items-center justify-center py-2 text-xs hover:bg-accent"
            onClick={() => { if (!user) navigate('/auth'); else navigate('/match'); }}
            aria-label="Match"
          >
            <Users className="h-5 w-5" />
            <span>Match</span>
          </button>
          <button
            className="flex flex-col items-center justify-center py-2 text-xs hover:bg-accent"
            onClick={() => { if (!user) navigate('/auth'); else navigate('/search'); }}
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
            <span>Search</span>
          </button>
          <button
            className="relative flex flex-col items-center justify-center py-2 text-xs hover:bg-accent"
            onClick={() => { if (!user) navigate('/auth'); else navigate('/likes'); }}
            aria-label="Likes"
          >
            <ThumbsUp className="h-5 w-5" />
            <span>Likes</span>
            {likesCount > 0 && (
              <span className="absolute top-1.5 right-5 rounded-full bg-primary text-primary-foreground px-1 text-[10px] leading-none">
                {likesCount > 99 ? '99+' : likesCount}
              </span>
            )}
          </button>
          <button
            className="relative flex flex-col items-center justify-center py-2 text-xs hover:bg-accent"
            onClick={() => { if (!user) navigate('/auth'); else navigate('/connections'); }}
            aria-label="Connections"
          >
            <Users2 className="h-5 w-5" />
            <span>Connect</span>
            {connectionsCount > 0 && (
              <span className="absolute top-1.5 right-3 rounded-full bg-primary text-primary-foreground px-1 text-[10px] leading-none">
                {connectionsCount > 99 ? '99+' : connectionsCount}
              </span>
            )}
          </button>
          <button
            className="flex flex-col items-center justify-center py-2 text-xs hover:bg-accent"
            onClick={() => { if (!user) navigate('/auth'); else navigate('/chats'); }}
            aria-label="Chats"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chats</span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
