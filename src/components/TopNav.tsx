import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, Users, ThumbsUp, MessageCircle, Calendar, Users2, Home } from 'lucide-react';
import { ComponentType } from 'react';
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

export default function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile } = useProfile();

  const GuardedLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: ComponentType<{ className?: string }> }) => (
    <button
      onClick={() => {
        if (!user) navigate('/auth');
        else navigate(to);
      }}
      className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:bg-accent text-sm"
    >
      <Icon className="h-4 w-4" /> {label}
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
          <Heart className="h-6 w-6 text-primary" />
          <button onClick={() => navigate('/')} className="font-semibold">CollegeMatch</button>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" className="group relative inline-flex items-center gap-1 px-3 py-2 rounded-md hover:bg-accent text-sm">
            <Home className="h-4 w-4" /> Home
            <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </NavLink>
          <GuardedLink to="/match" label="Match" icon={Users} />
          <GuardedLink to="/likes" label="Likes" icon={ThumbsUp} />
          <GuardedLink to="/chats" label="Chats" icon={MessageCircle} />
          <GuardedLink to="/events" label="Events" icon={Calendar} />
          <GuardedLink to="/clubs" label="Clubs" icon={Users2} />
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
                <DropdownMenuItem onClick={() => navigate('/chats')}>Chats</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/quiz')}>Compatibility Quiz</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
