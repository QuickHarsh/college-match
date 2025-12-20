/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Sparkles, Loader2, Search } from 'lucide-react';
import ShinyText from '@/reactbits/ShinyText';
import SpotlightCard from '@/reactbits/SpotlightCard';
import ProfileDetailsDialog from '@/components/ProfileDetailsDialog';
import { type Candidate } from '@/lib/matching';
import { toast } from 'sonner';

interface LeaderboardUser {
    user_id: string;
    full_name: string;
    profile_image_url: string | null;
    college_name: string | null;
    match_count: number;
    rank: number;
}

export default function Leaderboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [showProfile, setShowProfile] = useState(false);

    const handleUserClick = async (userId: string) => {
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
                // Ensure array fields
                const candidate: Candidate = {
                    ...data,
                    interests: data.interests || [],
                    image_url: data.profile_image_url  // Map for compatibility if needed
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
        const loadLeaderboard = async () => {
            try {
                setIsLoading(true);
                const sb: any = supabase as any;

                // 1. Fetch all mutual matches
                const { data: matches, error: mErr } = await sb
                    .from('matches')
                    .select('user1_id, user2_id')
                    .eq('is_mutual', true);

                if (mErr) throw mErr;

                // 2. Aggregate counts
                const counts: Record<string, number> = {};
                matches?.forEach((m: any) => {
                    counts[m.user1_id] = (counts[m.user1_id] || 0) + 1;
                    counts[m.user2_id] = (counts[m.user2_id] || 0) + 1;
                });

                // 3. Sort and take top 50
                const sortedIds = Object.entries(counts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 50)
                    .map(([id]) => id);

                if (sortedIds.length === 0) {
                    setUsers([]);
                    return;
                }

                // 4. Fetch profiles
                const { data: profiles, error: pErr } = await sb
                    .from('profiles')
                    .select('user_id, full_name, profile_image_url, college_name')
                    .in('user_id', sortedIds);

                if (pErr) throw pErr;

                // 5. Merge and format
                const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]));
                const leaderboardData: LeaderboardUser[] = sortedIds
                    .map((id, index) => {
                        const p: any = profileMap.get(id);
                        if (!p) return null;
                        return {
                            user_id: id,
                            full_name: p.full_name,
                            profile_image_url: p.profile_image_url,
                            college_name: p.college_name,
                            match_count: counts[id],
                            rank: index + 1,
                        };
                    })
                    .filter(Boolean) as LeaderboardUser[];

                setUsers(leaderboardData);

            } catch (error) {
                console.error('Error loading leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLeaderboard();
    }, []);

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pt-20">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto max-w-4xl p-6 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-3">
                        <Trophy className="w-10 h-10 text-yellow-500 fill-yellow-500 animate-bounce" />
                        <ShinyText text="Campus Leaderboard" disabled={false} speed={3} className="inline-block" />
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Top students making the most connections on CollegeMatch.
                        <br />
                        <span className="text-sm opacity-75">Updated in real-time based on mutual matches.</span>
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Calculating rankings...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No rankings yet</h3>
                        <p className="text-muted-foreground">Start matching to appear on the leaderboard!</p>
                    </div>
                ) : (
                    <>
                        {/* Podium Section */}
                        <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 mb-16 min-h-[300px]">
                            {/* 2nd Place */}
                            {top3[1] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="order-2 md:order-1 flex flex-col items-center"
                                >
                                    <div className="relative mb-4">
                                        <div
                                            className="w-20 h-20 rounded-full border-4 border-gray-300 overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => handleUserClick(top3[1].user_id)}
                                        >
                                            <img src={top3[1].profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${top3[1].full_name}`} className="w-full h-full object-cover" alt={top3[1].full_name} />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                            <Medal className="w-3 h-3" /> #2
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-t from-gray-300/20 to-transparent p-6 rounded-t-2xl w-32 md:w-40 text-center border-t border-x border-gray-300/30 backdrop-blur-sm">
                                        <div className="font-bold truncate w-full">{top3[1].full_name}</div>
                                        <div className="text-2xl font-black text-gray-400">{top3[1].match_count}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Matches</div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 1st Place */}
                            {top3[0] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="order-1 md:order-2 flex flex-col items-center z-10"
                                >
                                    <div className="relative mb-4">
                                        <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500 absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce" />
                                        <div
                                            className="w-28 h-28 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl shadow-yellow-500/20 cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => handleUserClick(top3[0].user_id)}
                                        >
                                            <img src={top3[0].profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${top3[0].full_name}`} className="w-full h-full object-cover" alt={top3[0].full_name} />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-sm font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                            <Trophy className="w-3 h-3 fill-current" /> #1
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-t from-yellow-500/20 to-transparent p-8 rounded-t-3xl w-40 md:w-48 text-center border-t border-x border-yellow-500/30 backdrop-blur-md h-48 flex flex-col justify-end pb-4">
                                        <div className="font-bold text-lg truncate w-full">{top3[0].full_name}</div>
                                        <div className="text-4xl font-black text-yellow-500">{top3[0].match_count}</div>
                                        <div className="text-xs text-yellow-600/80 font-medium uppercase tracking-wider">Matches</div>
                                        <div className="mt-2 text-xs text-muted-foreground truncate">{top3[0].college_name}</div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {top3[2] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="order-3 flex flex-col items-center"
                                >
                                    <div className="relative mb-4">
                                        <div
                                            className="w-20 h-20 rounded-full border-4 border-amber-700 overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => handleUserClick(top3[2].user_id)}
                                        >
                                            <img src={top3[2].profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${top3[2].full_name}`} className="w-full h-full object-cover" alt={top3[2].full_name} />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                            <Medal className="w-3 h-3" /> #3
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-t from-amber-700/20 to-transparent p-6 rounded-t-2xl w-32 md:w-40 text-center border-t border-x border-amber-700/30 backdrop-blur-sm h-32 flex flex-col justify-end pb-4">
                                        <div className="font-bold truncate w-full">{top3[2].full_name}</div>
                                        <div className="text-2xl font-black text-amber-700">{top3[2].match_count}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Matches</div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* List Section */}
                        <div className="space-y-4 max-w-2xl mx-auto">
                            {rest.map((user, i) => (
                                <motion.div
                                    key={user.user_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 + 0.4 }}
                                >
                                    <SpotlightCard className="bg-card/40 backdrop-blur-sm border-white/5 hover:bg-card/60 transition-colors" spotlightColor="rgba(255, 255, 255, 0.05)">
                                        <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => handleUserClick(user.user_id)}>
                                            <div className="font-bold text-muted-foreground w-8 text-center">#{user.rank}</div>
                                            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                <img src={user.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} className="w-full h-full object-cover" alt={user.full_name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold truncate hover:underline">{user.full_name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{user.college_name || 'Student'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-xl text-primary">{user.match_count}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Matches</div>
                                            </div>
                                        </div>
                                    </SpotlightCard>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ProfileDetailsDialog
                isOpen={showProfile}
                onOpenChange={setShowProfile}
                candidate={selectedCandidate}
            />
        </div >
    );
}
