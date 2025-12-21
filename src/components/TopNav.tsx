/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, ThumbsUp, MessageCircle, Calendar, Users2, Home, Search as SearchIcon, Sparkles, LogOut, User, Wallet, BrainCircuit, Info, Menu, Trophy, Shield, Megaphone } from 'lucide-react';
import { ComponentType, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useProfile } from '@/hooks/useProfile';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';

const ProfileMenu = ({ user, profile, navigate, signOut, likesCount, connectionsCount, children, side = "bottom" }: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {children}
    </DropdownMenuTrigger>
    <DropdownMenuContent side={side} align="end" className="w-64 p-2 animate-in slide-in-from-top-2 fade-in-20 duration-200">
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
          <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Social</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate('/likes')} className="cursor-pointer">
          <ThumbsUp className="mr-2 h-4 w-4 text-pink-500" />
          <span>Likes</span>
          {likesCount > 0 && <span className="ml-auto text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">{likesCount}</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/connections')} className="cursor-pointer">
          <Users2 className="mr-2 h-4 w-4 text-purple-500" />
          <span>Connections</span>
          {connectionsCount > 0 && <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{connectionsCount}</span>}
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Community</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate('/clubs')} className="cursor-pointer">
          <Users className="mr-2 h-4 w-4 text-indigo-500" />
          <span>Clubs</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/groups')} className="cursor-pointer">
          <Users2 className="mr-2 h-4 w-4 text-blue-500" />
          <span>Groups</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/leaderboard')} className="cursor-pointer">
          <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
          <span>Leaderboard</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      {profile?.is_admin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Admin</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4 text-red-500" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/events')} className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4 text-orange-500" />
              <span>Manage Events</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/clubs')} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Manage Clubs</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/announcements')} className="cursor-pointer">
              <Megaphone className="mr-2 h-4 w-4 text-blue-500" />
              <span>Announcements</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )}

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Account</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate('/setup')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/wallet')} className="cursor-pointer">
          <Wallet className="mr-2 h-4 w-4" />
          <span>Wallet</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/quiz')} className="cursor-pointer">
          <BrainCircuit className="mr-2 h-4 w-4" />
          <span>Compatibility Quiz</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/about')} className="cursor-pointer">
          <Info className="mr-2 h-4 w-4" />
          <span>About</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const [likesCount, setLikesCount] = useState<number>(0);
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const NavItem = ({ to, label, icon: Icon, badge }: { to: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number }) => {
    const isActive = location.pathname === to;

    return (
      <button
        onClick={() => {
          if (!user && to !== '/') navigate('/auth');
          else navigate(to);
        }}
        className={`relative group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
          }`}
      >
        <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span>{label}</span>
        {isActive && (
          <motion.div
            layoutId="navbar-indicator"
            className="absolute inset-0 rounded-full bg-primary/5 -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </button>
    );
  };

  // Hide TopNav on specific full-screen pages (Chat Room, Video Call)
  if (location.pathname.startsWith('/chat/') || location.pathname === '/match/video') {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm'
        : 'bg-background/80 md:bg-background/0 backdrop-blur-sm border-b border-transparent'
        }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
            {/* <div className="relative h-9 w-9 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Sparkles className="h-5 w-5" />
            </div> */}
          </div>
          <span className="font-bold text-3xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
            KeenQ
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-background/50 p-1 rounded-full border border-border/50 backdrop-blur-sm shadow-sm">
          <NavItem to="/" label="Home" icon={Home} />
          <NavItem to="/match" label="Match" icon={Users} />
          <NavItem to="/search" label="Search" icon={SearchIcon} />
          <NavItem to="/chats" label="Chats" icon={MessageCircle} />
          <NavItem to="/events" label="Events" icon={Calendar} />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {!user ? (
            <Button
              onClick={() => navigate('/auth')}
              className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              Get Started
            </Button>
          ) : (
            <ProfileMenu
              user={user}
              profile={profile}
              navigate={navigate}
              signOut={signOut}
              likesCount={likesCount}
              connectionsCount={connectionsCount}
            >
              <button className="flex items-center gap-2 rounded-full border p-1 pr-3 hover:bg-accent hover:border-primary/50 transition-all duration-300 group">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 overflow-hidden flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  {profile?.profile_image_url ? (
                    <img src={profile.profile_image_url} className="h-full w-full object-cover" alt="Profile" />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {profile?.full_name ? profile.full_name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate group-hover:text-primary transition-colors">
                  {profile?.full_name || 'Student'}
                </span>
              </button>
            </ProfileMenu>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/50 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-2">
          <button
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${location.pathname === '/match' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => { if (!user) navigate('/auth'); else navigate('/match'); }}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium">Match</span>
          </button>
          <button
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${location.pathname === '/events' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => { if (!user) navigate('/auth'); else navigate('/events'); }}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-medium">Events</span>
          </button>
          <button
            className="flex flex-col items-center justify-center -mt-6"
            onClick={() => navigate('/')}
          >
            <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-background">
              <Home className="h-6 w-6" />
            </div>
          </button>
          <button
            className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${location.pathname === '/chats' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => { if (!user) navigate('/auth'); else navigate('/chats'); }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">Chats</span>
          </button>

          {user ? (
            <ProfileMenu
              user={user}
              profile={profile}
              navigate={navigate}
              signOut={signOut}
              likesCount={likesCount}
              connectionsCount={connectionsCount}
              side="top"
            >
              <button
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${location.pathname === '/setup' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className="h-6 w-6 rounded-full overflow-hidden border border-border">
                  {profile?.profile_image_url ? (
                    <img src={profile.profile_image_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 m-auto" />
                  )}
                </div>
                <span className="text-[10px] font-medium">Profile</span>
              </button>
            </ProfileMenu>
          ) : (
            <button
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${location.pathname === '/setup' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => navigate('/auth')}
            >
              <div className="h-6 w-6 rounded-full overflow-hidden border border-border">
                <User className="h-4 w-4 m-auto" />
              </div>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}