import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MeetingProvider } from "@videosdk.live/react-sdk";
import { MeetingView } from '@/components/VideoSDK/MeetingView';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VideoCall() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const meetingId = searchParams.get('room');
  const rawToken = import.meta.env.VITE_VIDEOSDK_TOKEN;
  const token = rawToken ? rawToken.trim() : "";
  console.log("Using VideoSDK Token:", token ? `${token.substring(0, 10)}...` : "None", "Length:", token?.length);
  const [participantName, setParticipantName] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const prepareCall = async () => {
      if (!meetingId || !token) {
        setIsValid(false);
        return;
      }

      // Fetch latest profile name
      let name = user?.user_metadata?.full_name || "User";
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        if (data?.full_name) {
          name = data.full_name;
        }
      }

      setParticipantName(name);
      setIsValid(true);
      setIsReady(true);
    };

    prepareCall();
  }, [meetingId, token, user]);

  const onMeetingLeave = () => {
    navigate('/match');
  };

  if (isValid === null || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isTokenValid = token && token.startsWith("ey");

  if (!isValid || !token || !isTokenValid) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription className="space-y-2">
            {!token && <p>VideoSDK Token is missing in environment variables.</p>}
            {token && !isTokenValid && (
              <div>
                <p className="font-bold">Invalid Token Format!</p>
                <p>It looks like you might have used the <b>API Key</b> instead of the <b>JWT Token</b>.</p>
                <p>Please go to VideoSDK Dashboard &gt; API Keys &gt; Generate Token.</p>
              </div>
            )}
            {token && isTokenValid && !meetingId && <p>Invalid Meeting ID provided.</p>}
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
        name: participantName,
        debugMode: false,
      }}
      token={token}
    >
      <MeetingView meetingId={meetingId!} onMeetingLeave={onMeetingLeave} />
    </MeetingProvider>
  );
}

