import { useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useMemo, useRef } from "react";

export function ParticipantView({ participantId }: { participantId: string }) {
    const micRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
        useParticipant(participantId);

    const videoStream = useMemo(() => {
        if (webcamOn && webcamStream) {
            const mediaStream = new MediaStream();
            mediaStream.addTrack(webcamStream.track);
            return mediaStream;
        }
        return null;
    }, [webcamStream, webcamOn]);

    useEffect(() => {
        if (micRef.current) {
            if (micOn && micStream) {
                const mediaStream = new MediaStream();
                mediaStream.addTrack(micStream.track);

                micRef.current.srcObject = mediaStream;
                micRef.current
                    .play()
                    .catch((error) => console.error("micElem.current.play() failed", error));
            } else {
                micRef.current.srcObject = null;
            }
        }
    }, [micStream, micOn]);

    useEffect(() => {
        if (videoRef.current) {
            if (webcamOn && videoStream) {
                videoRef.current.srcObject = videoStream;
                videoRef.current.play().catch((error) => {
                    if (error.name === "AbortError") return;
                    console.error("videoElem.current.play() failed", error);
                });
            } else {
                videoRef.current.srcObject = null;
            }
        }
    }, [webcamOn, videoStream]);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            <audio ref={micRef} autoPlay playsInline muted={isLocal} />

            {webcamOn && videoStream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={true} // Always mute video element to avoid echo, audio is handled by audio tag
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="h-24 w-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                        {displayName ? displayName[0].toUpperCase() : "?"}
                    </div>
                </div>
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                    {displayName || 'Participant'} {isLocal ? "(You)" : ""}
                </span>
                {!micOn && <span className="text-red-500 text-xs">🔇</span>}
            </div>
        </div>
    );
}

