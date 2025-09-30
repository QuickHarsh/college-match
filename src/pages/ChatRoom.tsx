/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Phone, PhoneOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ChatVideoCall from '@/components/ChatVideoCall';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

export default function ChatRoom() {
  const { user, loading } = useAuth();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const [incoming, setIncoming] = useState<{ roomId: string; fromUserId: string } | null>(null);
  const [calling, setCalling] = useState<boolean>(false);
  const [inCall, setInCall] = useState<boolean>(false);
  const [callInitiator, setCallInitiator] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !matchId) return;
      try {
        const sb: any = supabase as any;
        const { data: room, error: rErr } = await sb
          .from('chat_rooms')
          .select('id, match_id')
          .eq('match_id', matchId)
          .maybeSingle();
        if (rErr || !room) throw rErr || new Error('No chat room');
        setRoomId(room.id);

        const { data: m, error: mErr } = await sb
          .from('messages')
          .select('id, sender_id, content, message_type, created_at')
          .eq('chat_room_id', room.id)
          .order('created_at', { ascending: true });
        if (mErr) throw mErr;
        setMsgs(m || []);

        // Realtime subscription for messages
        const channel = supabase.channel(`room-${room.id}`);
        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${room.id}` }, (payload) => {
          const msg = payload.new as ChatMessage;
          setMsgs((prev) => {
            // prevent duplicate by id
            if (prev.find((p) => p.id === msg.id)) return prev;
            // also remove any optimistic temp message from same sender with identical content within recent window
            const cutoff = Date.now() - 60_000;
            const filtered = prev.filter((p) => {
              if (!p.id.startsWith('temp-')) return true;
              const t = Date.parse(p.created_at);
              return !(p.sender_id === msg.sender_id && p.content === msg.content && t >= cutoff);
            });
            return [...filtered, msg];
          });
          setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 50);
        });
        channel.subscribe(() => {});

        // Call invites in-chat: listen to personal notify channel (separate event name from matching flow)
        const notify = supabase.channel(`notify-${user.id}`, { config: { broadcast: { self: false } } });
        notify.on('broadcast', { event: 'chat_call_invite' }, (payload) => {
          const data = (payload as any).payload;
          if (data?.roomId === room.id) {
            setIncoming({ roomId: data.roomId, fromUserId: data.fromUserId });
          }
        });
        notify.subscribe(() => {});

        return () => {
          supabase.removeChannel(channel);
          supabase.removeChannel(notify);
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load chat';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [user, matchId, navigate]);

  const send = async () => {
    if (!user || !roomId || !text.trim()) return;
    try {
      const sb: any = supabase as any;
      // Optimistic append
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        content: text.trim(),
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      setMsgs((prev) => [...prev, optimistic]);
      setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 10);
      const { error } = await sb.from('messages').insert({
        chat_room_id: roomId,
        sender_id: user.id,
        content: text.trim(),
        message_type: 'text',
      });
      if (error) throw error;
      setText('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send message';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const startCall = async () => {
    if (!user || !roomId) return;
    setCalling(true);
    try {
      // Find the other user id in this match
      const sb: any = supabase as any;
      const { data: m } = await sb
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .maybeSingle();
      const other = m?.user1_id === user.id ? m?.user2_id : m?.user1_id;
      if (!other) throw new Error('Other user not found');

      const channel = supabase.channel(`notify-${other}`, { config: { broadcast: { self: false } } });
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'chat_call_invite', payload: { roomId, fromUserId: user.id } });
          // remove channel shortly after
          setTimeout(() => supabase.removeChannel(channel), 500);
          // Open in-chat call overlay for caller
          setCallInitiator(true);
          setInCall(true);
          setCalling(false);
        }
      });
      toast({ title: 'Calling...', description: 'Ring, ring…' });
    } catch (e) {
      setCalling(false);
      const msg = e instanceof Error ? e.message : 'Failed to start call';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/chats')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Chat</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={calling ? 'secondary' : 'default'} onClick={startCall} disabled={calling || !roomId}>
                <Phone className="h-4 w-4 mr-2" /> {calling ? 'Calling...' : 'Call'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={listRef} className="h-[60vh] overflow-y-auto pr-2 space-y-2">
              {msgs.map((m) => (
                <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 ${m.sender_id === user?.id ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-muted'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Incoming Call Dialog */}
        <AlertDialog open={!!incoming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Incoming call</AlertDialogTitle>
              <AlertDialogDescription>
                Someone wants to start a video chat with you. Join now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIncoming(null)}>
                <PhoneOff className="h-4 w-4 mr-1" /> Reject
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => { setIncoming(null); setCallInitiator(false); setInCall(true); }}>
                <Phone className="h-4 w-4 mr-1" /> Accept
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {inCall && roomId && (
          <ChatVideoCall
            roomId={roomId}
            initiator={callInitiator}
            onEnd={() => { setInCall(false); setCallInitiator(false); }}
          />)
        }

      </div>
    </div>
  );
}
