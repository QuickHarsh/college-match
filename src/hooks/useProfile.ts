import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Profile = {
  user_id: string;
  email: string;
  college_email: string;
  full_name: string;
  college_name: string | null;
  branch: string | null;
  year_of_study: number | null;
  age: number | null;
  bio: string | null;
  interests: string[] | null;
  is_verified: boolean | null;
  profile_image_url: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      setError(error.message);
      setProfile(null);
    } else {
      setProfile(data as unknown as Profile);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isComplete = !!(
    profile &&
    profile.full_name &&
    profile.college_name &&
    profile.branch &&
    profile.year_of_study &&
    profile.age &&
    profile.interests && profile.interests.length >= 3
  );

  return { profile, loading, error, refresh: fetchProfile, isComplete };
}
