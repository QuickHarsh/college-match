/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from "lucide-react";

type RTCState = {
  pc: RTCPeerConnection | null;
  roomId: string | null;
  initiator: boolean;
};

export default function VideoCall() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef<RTCState>({ pc: null, roomId: null, initiator: false });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      if (!user || !mounted) return;

      // Room id from query or latest match room
      let roomId = params.get('room') || null;
      if (!roomId) {
        const sb: any = supabase as any;
        const { data: m, error: mErr } = await sb
          .from('matches')
          .select('id, user1_id, user2_id, is_mutual, created_at')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_mutual', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (mErr) return;
        const matchId = m?.[0]?.id;
        if (!matchId) return;
        const { data: room, error: rErr } = await sb
          .from('chat_rooms')
          .select('id, match_id')
          .eq('match_id', matchId)
          .maybeSingle();
        if (rErr) return;
        roomId = room?.id || null;
      }

      if (!roomId) return;
      stateRef.current.roomId = roomId;

      // Media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        return;
      }

      // Peer
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      stateRef.current.pc = pc;
      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current as MediaStream));
      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (remoteVideoRef.current && stream) {
          remoteVideoRef.current.srcObject = stream;
        } else {
          // fallback to aggregating tracks
          ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        }
      };

      // Signaling via Supabase Realtime
      const channel = supabase.channel(`webrtc-${roomId}`, { config: { broadcast: { self: false } } });
      channelRef.current = channel;
      let initiator = false;
      channel.on('presence', { event: 'sync' }, () => {
        const clients = Object.keys(channel.presenceState());
        initiator = clients.length === 1;
        stateRef.current.initiator = initiator;
      });

      await channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        await channel.track({ user_id: user.id });

        channel.on('broadcast', { event: 'offer' }, async (payload) => {
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: 'broadcast', event: 'answer', payload: answer });
        });
        channel.on('broadcast', { event: 'answer' }, async (payload) => {
          if (!pc) return;
          if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
          }
        });
        channel.on('broadcast', { event: 'ice' }, async (payload) => {
          if (!pc) return;
          try { await pc.addIceCandidate(new RTCIceCandidate(payload.payload)); } catch (e) { console.error('ICE add error', e); }
        });
        pc.onicecandidate = (ev) => { if (ev.candidate) channel.send({ type: 'broadcast', event: 'ice', payload: ev.candidate }); };

        // Negotiation
        pc.onnegotiationneeded = async () => {
          try {
            if (stateRef.current.initiator && pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({ type: 'broadcast', event: 'offer', payload: offer });
            }
          } catch (e) { console.error('negotiationneeded error', e); }
        };

        setTimeout(async () => {
          try {
            if (stateRef.current.initiator && pc.signalingState === 'stable' && !pc.localDescription) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({ type: 'broadcast', event: 'offer', payload: offer });
            }
          } catch (e) { console.error('initial offer error', e); }
        }, 400);
      });
    };

    start();

    return () => {
      mounted = false;
      const chan = channelRef.current;
      const pcSnap = stateRef.current.pc;
      const localStream = localStreamRef.current;
      try {
        if (chan) supabase.removeChannel(chan);
        if (pcSnap) {
          pcSnap.getSenders().forEach((s) => s.track && s.track.stop());
          pcSnap.close();
        }
        localStream?.getTracks().forEach((t) => t.stop());
      } catch (e) { console.error('cleanup error', e); }
    };
  }, [user, loading, params, navigate]);

  const toggleCam = () => {
    const stream = localStreamRef.current; if (!stream) return;
    const track = stream.getVideoTracks()[0]; if (!track) return;
    track.enabled = !track.enabled; setCamOn(track.enabled);
  };
  const toggleMic = () => {
    const stream = localStreamRef.current; if (!stream) return;
    const track = stream.getAudioTracks()[0]; if (!track) return;
    track.enabled = !track.enabled; setMicOn(track.enabled);
  };
  const endCall = () => { navigate('/match'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Video Match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              </div>
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant={micOn ? 'secondary' : 'default'} onClick={toggleMic}>
                {micOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />} {micOn ? 'Mute' : 'Unmute'}
              </Button>
              <Button variant={camOn ? 'secondary' : 'default'} onClick={toggleCam}>
                {camOn ? <VideoIcon className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />} {camOn ? 'Camera Off' : 'Camera On'}
              </Button>
              <Button variant="destructive" onClick={endCall}>
                <PhoneOff className="h-4 w-4 mr-2" /> End
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
