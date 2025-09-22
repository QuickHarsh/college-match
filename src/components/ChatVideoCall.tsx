/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ChatVideoCall({ roomId, initiator, onEnd }: { roomId: string; initiator: boolean; onEnd: () => void }) {
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      if (!mounted) return;
      // Media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) {
        console.error('getUserMedia error', e);
        onEnd();
        return;
      }

      // Peer
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;
      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current as MediaStream));

      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (remoteVideoRef.current && stream) remoteVideoRef.current.srcObject = stream;
        else ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      };

      // Signaling
      const channel = supabase.channel(`chatcall-${roomId}`, { config: { broadcast: { self: false }, presence: { key: user?.id || Math.random().toString(36).slice(2) } } });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'offer' }, async (payload) => {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(new RTCSessionDescription((payload as any).payload));
      });
      channel.on('broadcast', { event: 'ice' }, async (payload) => {
        if (!pcRef.current) return;
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate((payload as any).payload)); } catch (e) { console.error('ICE add', e); }
      });
      // Callee can request a fresh offer after they join
      channel.on('broadcast', { event: 'need_offer' }, async () => {
        const pc = pcRef.current;
        if (!pc) return;
        try {
          if (initiator && pc.signalingState === 'stable') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'offer', payload: offer });
          }
        } catch (e) { console.error('need_offer handling', e); }
      });

      pc.onicecandidate = (ev) => { if (ev.candidate) channel.send({ type: 'broadcast', event: 'ice', payload: ev.candidate }); };

      pc.onnegotiationneeded = async () => {
        try {
          if (initiator && pc.signalingState === 'stable') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'offer', payload: offer });
          }
        } catch (e) { console.error('negotiation', e); }
      };

      channel.on('presence', { event: 'sync' }, () => {
        const clients = Object.keys(channel.presenceState());
        // If initiator sees another participant, ensure an offer is sent
        if (initiator && pc.signalingState === 'stable' && clients.length >= 2) {
          pc.createOffer().then(async (offer) => {
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'offer', payload: offer });
          }).catch((e) => console.error('presence-triggered offer', e));
        }
      });

      channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        // announce presence
        await channel.track({ user_id: user?.id || 'anon' });
        // If NOT initiator, ask for offer as soon as we join
        if (!initiator) {
          channel.send({ type: 'broadcast', event: 'need_offer', payload: { roomId } });
        } else {
          // Initiator sends an initial offer shortly after join if alone
          setTimeout(async () => {
            try {
              if (pc.signalingState === 'stable' && !pc.localDescription) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({ type: 'broadcast', event: 'offer', payload: offer });
              }
            } catch (e) { console.error('initial offer', e); }
          }, 300);
        }
      });
    };

    start();

    return () => {
      mounted = false;
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        if (pcRef.current) {
          pcRef.current.getSenders().forEach((s) => s.track && s.track.stop());
          pcRef.current.close();
          pcRef.current = null;
        }
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch (e) { console.error('cleanup', e); }
    };
  }, [roomId, initiator, onEnd]);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-background/95">
        <div className="grid md:grid-cols-2 gap-3 p-3">
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="px-4 pb-4 flex items-center justify-center gap-3">
          <Button variant={micOn ? 'secondary' : 'default'} onClick={toggleMic}>
            {micOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />} {micOn ? 'Mute' : 'Unmute'}
          </Button>
          <Button variant={camOn ? 'secondary' : 'default'} onClick={toggleCam}>
            {camOn ? <VideoIcon className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />} {camOn ? 'Camera Off' : 'Camera On'}
          </Button>
          <Button variant="destructive" onClick={onEnd}>
            <PhoneOff className="h-4 w-4 mr-2" /> End
          </Button>
        </div>
      </Card>
    </div>
  );
}
