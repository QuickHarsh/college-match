/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Users, Signal, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);

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

      if (!roomId) {
        console.error("No room ID found");
        toast.error("Could not find a valid video room.");
        return;
      }
      console.log("Joining room:", roomId);
      stateRef.current.roomId = roomId;

      // Media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Media access error:", err);
        toast.error("Camera/Microphone access denied. Please check permissions.");
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
          setRemoteStreamActive(true);
        } else {
          ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
          setRemoteStreamActive(true);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("PC Connection State:", pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          toast.success("Connected!");
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          setRemoteStreamActive(false);
          toast.info("Connection lost");
        }
      };

      // Signaling via Supabase Realtime with presence
      const channel = supabase.channel(`webrtc-${roomId}`, { config: { broadcast: { self: false }, presence: { key: user.id } } });
      channelRef.current = channel;
      let initiator = false;
      channel.on('presence', { event: 'sync' }, () => {
        const clients = Object.keys(channel.presenceState());
        console.log("Presence sync:", clients);
        initiator = clients.length === 1;
        stateRef.current.initiator = initiator;
      });

      await channel.subscribe(async (status) => {
        console.log("Subscription status:", status);
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id });
        } else if (status === 'CLOSED') {
          console.error("Channel closed unexpectedly");
          toast.error("Connection closed. Retrying...");
          // Optional: logic to rejoin
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Channel error");
          toast.error("Connection error. Please refresh.");
        }

        if (status !== 'SUBSCRIBED') return;

        channel.on('broadcast', { event: 'offer' }, async (payload) => {
          console.log("Received offer");
          if (!pc) return;
          try {
            if (pc.signalingState !== "stable") {
              // If we are already negotiating, we might need to ignore or rollback.
              // For simplicity in this demo, we proceed but log warning.
              console.warn("Received offer while not stable:", pc.signalingState);
            }
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({ type: 'broadcast', event: 'answer', payload: answer });
          } catch (e) { console.error('offer handling error', e); }
        });
        channel.on('broadcast', { event: 'answer' }, async (payload) => {
          console.log("Received answer");
          if (!pc) return;
          try {
            if (!pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
            }
          } catch (e) { console.error('answer handling error', e); }
        });
        channel.on('broadcast', { event: 'ice' }, async (payload) => {
          // console.log("Received ICE candidate");
          if (!pc) return;
          try { await pc.addIceCandidate(new RTCIceCandidate(payload.payload)); } catch (e) { console.error('ICE add error', e); }
        });
        channel.on('broadcast', { event: 'need_offer' }, async () => {
          console.log("Received need_offer");
          try {
            if (stateRef.current.initiator && pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({ type: 'broadcast', event: 'offer', payload: offer });
            }
          } catch (e) { console.error('need_offer handling error', e); }
        });
        pc.onicecandidate = (ev) => { if (ev.candidate) channel.send({ type: 'broadcast', event: 'ice', payload: ev.candidate }); };

        // Negotiation
        pc.onnegotiationneeded = async () => {
          console.log("Negotiation needed");
          try {
            if (stateRef.current.initiator && pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({ type: 'broadcast', event: 'offer', payload: offer });
            }
          } catch (e) { console.error('negotiationneeded error', e); }
        };

        // If NOT initiator, ask for offer immediately after subscribing
        if (!stateRef.current.initiator) {
          console.log("Not initiator, sending need_offer");
          channel.send({ type: 'broadcast', event: 'need_offer', payload: { roomId } });
        } else {
          // Initiator sends an initial offer shortly after join if alone
          console.log("Initiator, waiting to send offer");
          setTimeout(async () => {
            try {
              if (pc.signalingState === 'stable' && !pc.localDescription) {
                console.log("Sending initial offer");
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({ type: 'broadcast', event: 'offer', payload: offer });
              }
            } catch (e) { console.error('initial offer error', e); }
          }, 1000); // Increased delay slightly
        }
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
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">

      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 z-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Overlay if no remote video */}
        {!remoteStreamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm text-white">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center mb-6 relative z-10">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Waiting for match...</h2>
            <p className="text-gray-400">They should be here any moment!</p>
          </div>
        )}
      </div>

      {/* Local Video (Floating PiP) */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="absolute top-4 right-4 z-20 w-32 md:w-48 aspect-[3/4] md:aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing"
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
        />
        {!camOn && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <VideoOff className="w-8 h-8 text-gray-500" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 text-xs font-medium text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
          You
        </div>
      </motion.div>

      {/* Top Bar (Status) */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/90 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <Button
            variant={micOn ? "secondary" : "destructive"}
            size="icon"
            className={`w-12 h-12 rounded-full transition-all ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : ''}`}
            onClick={toggleMic}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={camOn ? "secondary" : "destructive"}
            size="icon"
            className={`w-12 h-12 rounded-full transition-all ${camOn ? 'bg-white/10 hover:bg-white/20 text-white' : ''}`}
            onClick={toggleCam}
          >
            {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <div className="w-px h-8 bg-white/20 mx-2" />

          <Button
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
            onClick={endCall}
          >
            <PhoneOff className="w-6 h-6 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
}
