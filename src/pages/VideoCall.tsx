import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MeetingProvider } from "@videosdk.live/react-sdk";
import { MeetingView } from '@/components/VideoSDK/MeetingView';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VideoCall() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const meetingId = searchParams.get('room');
  const token = import.meta.env.VITE_VIDEOSDK_TOKEN;
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (meetingId && token) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [meetingId, token]);

  const onMeetingLeave = () => {
    navigate('/match');
  };

  if (isValid === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isValid || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            {token ? "Invalid Meeting ID provided." : "VideoSDK Token is missing in environment variables."}
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={() => navigate('/match')} variant="outline" className="text-black dark:text-white">Go Back</Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meetingId!,
        micEnabled: true,
        webcamEnabled: true,
        name: user?.user_metadata?.full_name || "User",
        debugMode: false,
      }}
      token={token}
    >
      <MeetingView meetingId={meetingId!} onMeetingLeave={onMeetingLeave} />
    </MeetingProvider>
  );
}

