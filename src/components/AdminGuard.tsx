import { PropsWithChildren, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

export default function AdminGuard({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const { isComplete, loading: profileLoading, profile } = useProfile();
  const navigate = useNavigate();

  interface AdminProfileLike { is_admin?: boolean }

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    const isAdmin = Boolean((profile as AdminProfileLike)?.is_admin);
    if (!isComplete || !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, loading, profileLoading, isComplete, profile, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground text-sm">Checking admin access…</div>
      </div>
    );
  }

  return <>{children}</>;
}
