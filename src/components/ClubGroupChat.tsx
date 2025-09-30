/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ClubGroupChat({ clubId }: { clubId: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<ClubMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string; profile_image_url: string | null }>>({});
  const profilesRef = useRef(profiles);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || !clubId) return;
      try {
        const sb: any = supabase as any;
        const { data, error } = await sb
          .from('club_messages')
          .select('id, club_id, sender_id, content, created_at')
          .eq('club_id', clubId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (!mounted) return;
        setMsgs((data || []) as ClubMessage[]);
        // Fetch sender profiles for avatars
        const uniqueSenderIds = Array.from(new Set(((data || []) as ClubMessage[]).map((m) => m.sender_id)));
        if (uniqueSenderIds.length > 0) {
          const { data: profs, error: pErr } = await sb
            .from('profiles')
            .select('user_id, full_name, profile_image_url')
            .in('user_id', uniqueSenderIds);
          if (!pErr && profs) {
            const map: Record<string, { full_name: string; profile_image_url: string | null }> = {};
            (profs as Array<{ user_id: string; full_name: string; profile_image_url: string | null }>).forEach((p) => {
              map[p.user_id] = { full_name: p.full_name, profile_image_url: p.profile_image_url };
            });
            setProfiles((prev) => ({ ...map, ...prev }));
          }
        }
        setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 10);

        const channel = supabase.channel(`club-${clubId}`);
        channel.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `club_id=eq.${clubId}` },
          (payload) => {
            const m = payload.new as ClubMessage;
            setMsgs((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
            // Ensure profile for this sender is cached
            if (!profilesRef.current[m.sender_id]) {
              (async () => {
                try {
                  const { data: p } = await (supabase as any)
                    .from('profiles')
                    .select('user_id, full_name, profile_image_url')
                    .eq('user_id', m.sender_id)
                    .maybeSingle();
                  if (p) {
                    setProfiles((prev) => ({ ...prev, [p.user_id]: { full_name: p.full_name, profile_image_url: p.profile_image_url } }));
                  }
                } catch (err) {
                  console.error('profile fetch error', err);
                }
              })();
            }
            setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 50);
          }
        );
        channel.subscribe(() => {});

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load messages';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, clubId]);

  const send = async () => {
    if (!user || !clubId || !text.trim()) return;
    try {
      const sb: any = supabase as any;
      // optimistic render
      const optimistic: ClubMessage = {
        id: `temp-${Date.now()}`,
        club_id: clubId,
        sender_id: user.id,
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      setMsgs((prev) => [...prev, optimistic]);
      // Ensure current user's profile is cached for avatar
      if (!profiles[user.id]) {
        try {
          const { data: me } = await sb
            .from('profiles')
            .select('user_id, full_name, profile_image_url')
            .eq('user_id', user.id)
            .maybeSingle();
          if (me) setProfiles((prev) => ({ ...prev, [me.user_id]: { full_name: me.full_name, profile_image_url: me.profile_image_url } }));
        } catch (err) {
          console.error('self profile fetch error', err);
        }
      }
      setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 10);

      const { error } = await sb.from('club_messages').insert({ club_id: clubId, sender_id: user.id, content: text.trim() });
      if (error) throw error;
      setText('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send message';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Club Group</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={listRef} className="h-[60vh] overflow-y-auto pr-2 space-y-2">
          {msgs.map((m) => {
            const mine = m.sender_id === user?.id;
            const prof = profiles[m.sender_id];
            return (
              <div key={m.id} className={`flex items-start gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {prof?.profile_image_url ? <img src={prof.profile_image_url} className="h-full w-full object-cover" /> : null}
                  </div>
                )}
                <div className={`max-w-[78%] rounded-lg px-3 py-2 ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="text-xs opacity-70 mb-0.5">{mine ? 'You' : (prof?.full_name || 'Member')}</div>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
                {mine && (
                  <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {profiles[user!.id]?.profile_image_url ? <img src={profiles[user!.id].profile_image_url!} className="h-full w-full object-cover" /> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
          <Button onClick={send}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
