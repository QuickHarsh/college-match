import { useMeeting } from "@videosdk.live/react-sdk";
import { useMemo, useEffect, useState, useRef } from "react";
import { ParticipantView } from "./ParticipantView";
import { Controls } from "./Controls";
import { AlertCircle } from "lucide-react";

export function MeetingView({ meetingId, onMeetingLeave }: { meetingId: string, onMeetingLeave: () => void }) {
    const [joined, setJoined] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hasJoined = useRef(false);

    const { join, participants } = useMeeting({
        onMeetingJoined: () => {
            setJoined("JOINED");
            setError(null);
        },
        onMeetingLeft: () => {
            onMeetingLeave();
        },
        onError: (error) => {
            console.error("Meeting Error", error);
            setError(error.message);
        }
    });

    const participantIds = useMemo(() => {
        return [...participants.keys()];
    }, [participants]);

    useEffect(() => {
        if (!hasJoined.current) {
            hasJoined.current = true;
            join();
        }
    }, [join]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 p-4">
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Connection Failed</h3>
                    <p className="text-red-200">{error}</p>
                    <button
                        onClick={onMeetingLeave}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="flex flex-col h-screen bg-gray-950 p-4">
            {/* Video Grid */}
            <div className={`flex-1 grid gap-4 ${participantIds.length <= 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {participantIds.map((participantId) => (
                    <div key={participantId} className="relative w-full h-full min-h-[300px]">
                        <ParticipantView participantId={participantId} />
                    </div>
                ))}

                {/* Waiting State if alone */}
                {participantIds.length === 1 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl text-center space-y-2 max-w-sm pointer-events-auto">
                            <div className="text-2xl">👀</div>
                            <h3 className="text-white font-bold text-xl">Waiting for others...</h3>
                            <p className="text-white/60 text-sm">You are in the call.</p>
                        </div>
                    </div>
                )}
            </div>

            <Controls onLeave={onMeetingLeave} />
        </div>
    );
}

