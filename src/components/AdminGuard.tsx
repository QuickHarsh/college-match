import { PropsWithChildren, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export default function AdminGuard({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const { isComplete, loading: profileLoading, profile, refresh } = useProfile();
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Check if user is admin
    const isAdmin = !!profile?.is_admin;

    if (!isAdmin) {
      // Show debug screen instead of redirecting
      setShowDebug(true);
      // navigate('/', { replace: true });
    } else {
      setShowDebug(false);
    }
  }, [user, loading, profileLoading, profile, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground text-sm">Checking admin access…</div>
      </div>
    );
  }

  if (showDebug) {
    const isAdmin = !!profile?.is_admin;
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied (Debug Mode)</h1>
        <p className="mb-4">You are not recognized as an admin.</p>
        <div className="bg-muted p-4 rounded text-left text-xs font-mono max-w-lg overflow-auto mb-4">
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Is Admin Check:</strong> {isAdmin ? 'TRUE' : 'FALSE'}</p>
          <p><strong>Profile Data:</strong></p>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => refresh()} variant="outline">Refresh Profile</Button>
          <Button onClick={() => window.location.reload()} variant="secondary">Reload Page</Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          If "is_admin" is missing above, check your Supabase "profiles" table.<br />
          If it is present but false, update it to TRUE.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
