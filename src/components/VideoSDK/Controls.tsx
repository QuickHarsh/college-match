import { useMeeting } from "@videosdk.live/react-sdk";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Controls() {
    const { toggleMic, toggleWebcam, leave, localMicOn, localWebcamOn } = useMeeting();

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/80 backdrop-blur-md p-4 rounded-full border shadow-xl z-50">
            <Button
                variant={localMicOn ? "outline" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => toggleMic()}
            >
                {localMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
                variant={localWebcamOn ? "outline" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => toggleWebcam()}
            >
                {localWebcamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
                onClick={() => leave()}
            >
                <PhoneOff className="h-6 w-6" />
            </Button>
        </div>
    );
}
