import { useMeeting } from "@videosdk.live/react-sdk";
import { useMemo, useState } from "react";
import { ParticipantView } from "./ParticipantView";
import { Controls } from "./Controls";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MeetingView({ meetingId, onMeetingLeave }: { meetingId: string, onMeetingLeave: () => void }) {
    const [copied, setCopied] = useState(false);
    const { participants, leave } = useMeeting({
        onMeetingLeft: () => {
            onMeetingLeave();
        },
    });

    const participantIds = useMemo(() => {
        return [...participants.keys()];
    }, [participants]);

    const copyMeetingId = () => {
        navigator.clipboard.writeText(meetingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-950 p-4 pt-20">
            {/* Header Info */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">Meeting ID:</span>
                    <code className="text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded text-sm font-mono">{meetingId}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/60 hover:text-white" onClick={copyMeetingId}>
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                </div>
                <div className="text-white/60 text-sm">
                    {participantIds.length} {participantIds.length === 1 ? 'Participant' : 'Participants'}
                </div>
            </div>

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
                            <p className="text-white/60 text-sm">Share the meeting ID or wait for your match to join.</p>
                        </div>
                    </div>
                )}
            </div>

            <Controls />
        </div>
    );
}
