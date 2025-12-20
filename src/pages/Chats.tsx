import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { MessageCircle, Search, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePresence } from '@/hooks/usePresence';
import ProfileDetailsDialog from '@/components/ProfileDetailsDialog';
import { type Candidate } from '@/lib/matching';
import { toast } from 'sonner';

interface MatchProfile {
    match_id: string;
    user_id: string;
    full_name: string;
    profile_image_url: string;
    last_message?: string;
    last_seen?: string;
}

export default function Chats() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<MatchProfile[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { isUserOnline } = usePresence();

    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [showProfile, setShowProfile] = useState(false);

    const handleUserClick = async (userId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sb: any = supabase;
            const { data, error } = await sb
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            if (data) {
                const candidate: Candidate = {
                    ...data,
                    interests: data.interests || [],
                    image_url: data.profile_image_url
                };
                setSelectedCandidate(candidate);
                setShowProfile(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not load profile");
        }
    };

    useEffect(() => {
        if (!loading && !user) navigate('/auth');
    }, [user, loading, navigate]);

    useEffect(() => {
        const fetchMatches = async () => {
            if (!user) return;

            try {
                setIsLoadingMatches(true);

                // 1. Fetch confirmed mutual matches involving the current user
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sb: any = supabase as any;
                const { data: matchesData, error: matchError } = await sb
                    .from('matches')
                    .select('id, user1_id, user2_id')
                    .eq('is_mutual', true)
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

                if (matchError) throw matchError;

                if (!matchesData || matchesData.length === 0) {
                    setMatches([]);
                    return;
                }

                // 2. Collect other user IDs
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const otherUserIds = matchesData.map((m: any) =>
                    m.user1_id === user.id ? m.user2_id : m.user1_id
                );

                // 3. Fetch profiles for these users
                const { data: profilesData, error: profileError } = await sb
                    .from('profiles')
                    .select('user_id, full_name, profile_image_url')
                    .in('user_id', otherUserIds);

                if (profileError) throw profileError;

                // 4. Map profiles back to matches
                const profileMap = new Map();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                profilesData?.forEach((p: any) => profileMap.set(p.user_id, p));

                // 5. Fetch last messages for these matches
                // We need to find the chat_room_id for each match first
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const matchIds = matchesData.map((m: any) => m.id);
                const { data: roomsData } = await sb
                    .from('chat_rooms')
                    .select('id, match_id')
                    .in('match_id', matchIds);

                const roomMap = new Map();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                roomsData?.forEach((r: any) => roomMap.set(r.match_id, r.id));

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const roomIds = roomsData?.map((r: any) => r.id) || [];

                // Fetch latest message for each room
                // Note: This is a bit tricky in one query without a complex join or function. 
                // For now, we'll fetch the latest messages for these rooms.
                // A better approach would be a Postgres function or a view.
                // We will fetch all messages for these rooms ordered by time, but that's heavy.
                // Let's try to fetch the most recent message for each room using a separate query per room (parallelized) 
                // or just accept "Start chatting!" if no message found for now, but let's try to get it.

                const lastMessagesMap = new Map();
                if (roomIds.length > 0) {
                    // Optimization: Fetch latest messages via a custom query or just fetch recent messages
                    // For MVP, let's just fetch the last 1 message for each room in parallel
                    await Promise.all(roomIds.map(async (rid: string) => {
                        const { data: msgs } = await sb
                            .from('messages')
                            .select('content, created_at')
                            .eq('chat_room_id', rid)
                            .order('created_at', { ascending: false })
                            .limit(1);
                        if (msgs && msgs.length > 0) {
                            lastMessagesMap.set(rid, msgs[0]);
                        }
                    }));
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedMatches: MatchProfile[] = matchesData.map((m: any) => {
                    const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const profile: any = profileMap.get(otherId);
                    const roomId = roomMap.get(m.id);
                    const lastMsg = lastMessagesMap.get(roomId);

                    return {
                        match_id: m.id,
                        user_id: otherId,
                        full_name: profile?.full_name || 'Unknown User',
                        profile_image_url: profile?.profile_image_url,
                        last_message: lastMsg ? lastMsg.content : 'Start chatting!',
                        last_seen: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                    };
                });

                setMatches(formattedMatches);

            } catch (error) {
                console.error('Error fetching matches:', error);
            } finally {
                setIsLoadingMatches(false);
            }
        };

        fetchMatches();
    }, [user]);

    const filteredMatches = matches.filter(m =>
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black pt-20 pb-20">
            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            Messages
                        </h1>
                        <p className="text-muted-foreground text-sm">Connect with your matches</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                        <MessageCircle className="w-6 h-6 text-pink-500" />
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search matches..."
                        className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:ring-pink-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Matches List */}
                <div className="space-y-3">
                    {isLoadingMatches ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading conversations...</p>
                        </div>
                    ) : filteredMatches.length > 0 ? (
                        filteredMatches.map((match, i) => (
                            <motion.div
                                key={match.match_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/chat/${match.match_id}`)}
                                className="group relative bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative" onClick={(e) => handleUserClick(match.user_id, e)}>
                                        <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-purple-600 hover:scale-110 transition-transform">
                                            <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                <img
                                                    src={match.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${match.full_name}`}
                                                    alt={match.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-900 rounded-full ${isUserOnline(match.user_id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
                                                {match.full_name}
                                            </h3>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {match.last_seen}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate group-hover:text-pink-600 transition-colors">
                                            {match.last_message}
                                        </p>
                                    </div>

                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                                <MessageCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">No matches yet</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                                    Start swiping to find people and start a conversation!
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/match')}
                                className="text-pink-600 font-medium hover:underline"
                            >
                                Go to Matching
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <ProfileDetailsDialog
                isOpen={showProfile}
                onOpenChange={setShowProfile}
                candidate={selectedCandidate}
            />
        </div>
    );
}
