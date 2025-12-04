import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Video, Phone, MoreVertical, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePresence } from '@/hooks/usePresence';

interface ChatMessage {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    message_type: 'text' | 'image' | 'video';
}

interface UserProfile {
    user_id: string;
    full_name: string;
    profile_image_url?: string;
}

export default function ChatRoom() {
    const { user, loading } = useAuth();
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [isSending, setIsSending] = useState(false);
    const { isUserOnline } = usePresence();
    const isOnline = otherUser ? isUserOnline(otherUser.user_id) : false;

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auth Check
    useEffect(() => {
        if (!loading && !user) navigate('/auth');
    }, [user, loading, navigate]);

    // 1. Initialize Chat Room & Load Data
    useEffect(() => {
        const initChat = async () => {
            if (!user || !matchId) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sb: any = supabase;

            try {
                // A. Get or Create Room
                let roomData;
                const { data: existingRoom, error: roomError } = await sb
                    .from('chat_rooms')
                    .select('id')
                    .eq('match_id', matchId)
                    .maybeSingle();

                if (roomError) throw roomError;

                if (existingRoom) {
                    roomData = existingRoom;
                } else {
                    // Create room if not exists (safety fallback)
                    const { data: newRoom, error: createError } = await sb
                        .from('chat_rooms')
                        .insert({ match_id: matchId })
                        .select('id')
                        .single();
                    if (createError) throw createError;
                    roomData = newRoom;
                }

                setRoomId(roomData.id);

                // B. Load Other User Profile
                const { data: matchData } = await sb
                    .from('matches')
                    .select('user1_id, user2_id')
                    .eq('id', matchId)
                    .single();

                if (matchData) {
                    const otherId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;
                    const { data: profile } = await sb
                        .from('profiles')
                        .select('full_name, profile_image_url')
                        .eq('user_id', otherId)
                        .single();
                    setOtherUser({ ...profile, user_id: otherId });
                }

                // C. Load Initial Messages
                const { data: msgs, error: msgError } = await sb
                    .from('messages')
                    .select('*')
                    .eq('chat_room_id', roomData.id)
                    .order('created_at', { ascending: true });

                if (msgError) throw msgError;
                setMessages(msgs || []);

            } catch (error) {
                console.error('Init chat error:', error);
                toast.error('Failed to load chat.');
            }
        };

        initChat();
    }, [user, matchId]);

    // 2. Realtime Subscription
    useEffect(() => {
        if (!roomId) return;

        console.log('Subscribing to room:', roomId);
        const channel = supabase.channel(`room-${roomId}`);

        // Listen for new messages in DB
        channel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${roomId}` },
            (payload) => {
                console.log('New message received via realtime:', payload);
                const newMsg = payload.new as ChatMessage;
                setMessages((prev) => {
                    // 1. Check if we already have this exact message ID
                    if (prev.some(m => m.id === newMsg.id)) return prev;

                    // 2. Check if we have a temp message that matches this one (same content & sender)
                    // This handles the "optimistic update" replacement
                    const tempMatchIndex = prev.findIndex(m =>
                        m.id.startsWith('temp-') &&
                        m.content === newMsg.content &&
                        m.sender_id === newMsg.sender_id
                    );

                    if (tempMatchIndex !== -1) {
                        // Replace the temp message with the real one
                        const newMessages = [...prev];
                        newMessages[tempMatchIndex] = newMsg;
                        return newMessages;
                    }

                    // 3. Otherwise, just append it
                    return [...prev, newMsg];
                });
            }
        );

        channel.subscribe((status) => {
            console.log('Subscription status:', status);
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    // 3. Polling Fallback (ensure messages load even if realtime fails)
    useEffect(() => {
        if (!roomId) return;

        const fetchNewMessages = async () => {
            // Get the last *real* message (ignore temps for query)
            const realMessages = messages.filter(m => !m.id.startsWith('temp-'));
            const lastMsg = realMessages[realMessages.length - 1];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sb: any = supabase;

            let query = sb
                .from('messages')
                .select('*')
                .eq('chat_room_id', roomId)
                .order('created_at', { ascending: true });

            if (lastMsg) {
                query = query.gt('created_at', lastMsg.created_at);
            }

            const { data, error } = await query;

            if (!error && data && data.length > 0) {
                console.log('Fetched new messages via polling:', data.length);
                setMessages((prev) => {
                    const updated = [...prev];

                    data.forEach((newMsg: ChatMessage) => {
                        // 1. Check if exists
                        if (updated.some(m => m.id === newMsg.id)) return;

                        // 2. Check for temp match to replace
                        const tempMatchIndex = updated.findIndex(m =>
                            m.id.startsWith('temp-') &&
                            m.content === newMsg.content &&
                            m.sender_id === newMsg.sender_id
                        );

                        if (tempMatchIndex !== -1) {
                            updated[tempMatchIndex] = newMsg;
                        } else {
                            updated.push(newMsg);
                        }
                    });

                    return updated;
                });
            }
        };

        const interval = setInterval(fetchNewMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [roomId, messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // 3. Send Message Logic
    const handleSend = async () => {
        if (!inputText.trim() || !user || !roomId) return;

        const text = inputText.trim();
        setInputText(''); // Clear input immediately

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: ChatMessage = {
            id: tempId,
            sender_id: user.id,
            content: text,
            message_type: 'text',
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setIsSending(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb: any = supabase;

        try {
            const { error } = await sb
                .from('messages')
                .insert({
                    chat_room_id: roomId,
                    sender_id: user.id,
                    content: text,
                    message_type: 'text'
                });

            if (error) throw error;
            // Success: Subscription will replace temp msg with real one
        } catch (error) {
            console.error('Send error:', error);
            toast.error('Failed to send message');
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInputText(text); // Restore text
        } finally {
            setIsSending(false);
        }
    };

    // 4. Video Call Logic
    const handleStartCall = async () => {
        if (!user || !roomId) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb: any = supabase;

        try {
            // Find other user ID again to be safe
            const { data: m } = await sb
                .from('matches')
                .select('user1_id, user2_id')
                .eq('id', matchId)
                .single();

            if (!m) return;
            const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;

            // Send Signal
            const channel = supabase.channel(`notify-${otherId}`);
            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channel.send({
                        type: 'broadcast',
                        event: 'call_invite',
                        payload: {
                            roomId,
                            callerId: user.id,
                            callerName: user.user_metadata.full_name
                        }
                    });

                    toast.success('Starting video call...');
                    navigate(`/match/video?room=${roomId}`);
                }
            });

        } catch (error) {
            console.error('Call error:', error);
            toast.error('Could not start call.');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/chats')} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    {otherUser ? (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <img
                                        src={otherUser.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.full_name}`}
                                        alt={otherUser.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-gray-900 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm">{otherUser.full_name}</h2>
                                <p className={`text-xs font-medium ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                            <div className="space-y-1">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30">
                        <Phone className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleStartCall}
                        className="rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    >
                        <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-gray-500">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                        ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    {msg.content}
                                    <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-pink-100' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50">
                        <MessageCircle className="w-12 h-12" />
                        <p>No messages yet. Say hi!</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 max-w-4xl mx-auto"
                >
                    <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-pink-500"
                        disabled={isSending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!inputText.trim() || isSending}
                        className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition-opacity shadow-md"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
