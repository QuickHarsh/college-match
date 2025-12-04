/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Loader2, MessageCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  profile_image_url: string | null;
}

export default function ClubGroupChat({ clubId }: { clubId: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<ClubMessage[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const profilesRef = useRef(profiles);

  // Keep ref in sync for realtime updates
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  // 1. Load Initial Data & Subscribe
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || !clubId) return;
      try {
        const sb: any = supabase as any;

        // Fetch Messages
        const { data, error } = await sb
          .from('club_messages')
          .select('id, club_id, sender_id, content, created_at')
          .eq('club_id', clubId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        setMsgs((data || []) as ClubMessage[]);

        // Fetch Profiles
        const uniqueSenderIds = Array.from(new Set(((data || []) as ClubMessage[]).map((m) => m.sender_id)));
        if (uniqueSenderIds.length > 0) {
          const { data: profs, error: pErr } = await sb
            .from('profiles')
            .select('user_id, full_name, profile_image_url')
            .in('user_id', uniqueSenderIds);

          if (!pErr && profs) {
            const map: Record<string, UserProfile> = {};
            profs.forEach((p: UserProfile) => {
              map[p.user_id] = p;
            });
            setProfiles((prev) => ({ ...map, ...prev }));
          }
        }

        // Scroll to bottom
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        }, 100);

        // Realtime Subscription
        const channel = supabase.channel(`club-${clubId}`);
        channel.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `club_id=eq.${clubId}` },
          (payload) => {
            const m = payload.new as ClubMessage;

            setMsgs((prev) => {
              // Deduplicate
              if (prev.some(x => x.id === m.id)) return prev;

              // Handle Optimistic Replacement
              const tempIndex = prev.findIndex(x => x.id.startsWith('temp-') && x.content === m.content && x.sender_id === m.sender_id);
              if (tempIndex !== -1) {
                const newMsgs = [...prev];
                newMsgs[tempIndex] = m;
                return newMsgs;
              }
              return [...prev, m];
            });

            // Fetch profile if missing
            if (!profilesRef.current[m.sender_id]) {
              (async () => {
                try {
                  const { data: p } = await (supabase as any)
                    .from('profiles')
                    .select('user_id, full_name, profile_image_url')
                    .eq('user_id', m.sender_id)
                    .maybeSingle();
                  if (p) {
                    setProfiles((prev) => ({ ...prev, [p.user_id]: p }));
                  }
                } catch (err) {
                  console.error('profile fetch error', err);
                }
              })();
            }

            // Scroll to bottom on new message
            setTimeout(() => {
              if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
              }
            }, 100);
          }
        );
        channel.subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (e) {
        console.error(e);
        toast.error('Failed to load messages');
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, clubId]);

  // 2. Polling Fallback
  useEffect(() => {
    if (!clubId) return;
    const interval = setInterval(async () => {
      const realMsgs = msgs.filter(m => !m.id.startsWith('temp-'));
      const lastMsg = realMsgs[realMsgs.length - 1];

      const sb: any = supabase as any;
      let query = sb
        .from('club_messages')
        .select('id, club_id, sender_id, content, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: true });

      if (lastMsg) {
        query = query.gt('created_at', lastMsg.created_at);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setMsgs(prev => {
          const updated = [...prev];
          data.forEach((newMsg: ClubMessage) => {
            if (updated.some(m => m.id === newMsg.id)) return;
            // Check optimistic
            const tempIndex = updated.findIndex(m => m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id);
            if (tempIndex !== -1) {
              updated[tempIndex] = newMsg;
            } else {
              updated.push(newMsg);
            }
          });
          return updated;
        });

        // Fetch missing profiles for polled messages
        const missingIds = new Set(data.map((m: ClubMessage) => m.sender_id).filter((id: string) => !profilesRef.current[id]));
        if (missingIds.size > 0) {
          const { data: profs } = await sb.from('profiles').select('*').in('user_id', Array.from(missingIds));
          if (profs) {
            const map: Record<string, UserProfile> = {};
            profs.forEach((p: UserProfile) => map[p.user_id] = p);
            setProfiles(prev => ({ ...prev, ...map }));
          }
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [clubId, msgs]);

  // 3. Send Message
  const send = async () => {
    if (!user || !clubId || !text.trim()) return;

    const content = text.trim();
    setText('');
    setIsSending(true);

    try {
      const sb: any = supabase as any;

      // Optimistic Update
      const tempId = `temp-${Date.now()}`;
      const optimistic: ClubMessage = {
        id: tempId,
        club_id: clubId,
        sender_id: user.id,
        content: content,
        created_at: new Date().toISOString(),
      };

      setMsgs((prev) => [...prev, optimistic]);

      // Ensure self profile
      if (!profiles[user.id]) {
        const { data: me } = await sb.from('profiles').select('*').eq('user_id', user.id).single();
        if (me) setProfiles(prev => ({ ...prev, [me.user_id]: me }));
      }

      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 10);

      const { error } = await sb.from('club_messages').insert({ club_id: clubId, sender_id: user.id, content: content });
      if (error) throw error;

    } catch (e) {
      console.error(e);
      toast.error('Failed to send message');
      // Revert optimistic? Or just let it fail silently as polling might pick it up if it actually succeeded
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black/20">
      {/* Messages List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {msgs.map((m) => {
            const isMe = m.sender_id === user?.id;
            const prof = profiles[m.sender_id];

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700 mb-1">
                    {prof?.profile_image_url ? (
                      <img src={prof.profile_image_url} alt={prof.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                        {prof?.full_name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] text-gray-500 ml-1 mb-1">
                      {prof?.full_name || 'Member'}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                      }`}
                  >
                    {m.content}
                    <div className={`text-[10px] mt-1 opacity-70 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50 py-20">
            <MessageCircle className="w-12 h-12" />
            <p>No messages yet. Be the first to say hi!</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || isSending}
            className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 transition-opacity shadow-md"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
