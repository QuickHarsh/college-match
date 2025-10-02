/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { likeUser, type Candidate } from '@/lib/matching';
import { ThumbsUp, Sparkles, Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const normalized = useMemo(() => query.trim(), [query]);

  const load = async () => {
    if (!user) return;
    try {
      setLoadingResults(true);
      const sb: any = supabase as any;
      let q = sb
        .from('profiles')
        .select('user_id, full_name, college_name, branch, year_of_study, age, bio, interests, profile_image_url, is_verified')
        .neq('user_id', user.id)
        .eq('is_verified', true)
        .limit(50);

      if (normalized.length > 0) {
        // Search across name, branch, and college
        q = q.or(
          `full_name.ilike.%${normalized}%,branch.ilike.%${normalized}%,college_name.ilike.%${normalized}%`
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      setResults((data || []) as Candidate[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to search profiles';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLike = async (targetId: string) => {
    if (!user) return;
    try {
      const res = await likeUser(user.id, targetId);
      if (res.isMutual) {
        toast({ title: "It's a match!", description: 'Starting a video call...' });
        setTimeout(() => navigate('/match/video'), 700);
      } else {
        toast({ title: 'Like sent', description: 'We\'ll notify you if it\'s a match.' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to like user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {/* Placeholder for logo (intentionally empty). Replace with your custom logo when ready. */}
            <div className="h-6 w-6" aria-hidden />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Discover verified students across colleges. Search and like profiles. Mutual likes create a match and unlock chat.</p>
        </div>

        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, branch, college..."
                  className="pl-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') load();
                  }}
                />
              </div>
              <Button onClick={load} disabled={loadingResults}>
                <Sparkles className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {loadingResults && (
          <div className="text-center text-sm text-muted-foreground py-8">Searching...</div>
        )}

        {!loadingResults && results.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">No profiles found. Try a different search.</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {results.map((p) => (
            <div key={p.user_id} className="group relative overflow-hidden rounded-xl border bg-card">
              <div className="aspect-square w-full bg-muted overflow-hidden">
                {p.profile_image_url ? (
                  <img src={p.profile_image_url} alt={p.full_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Photo</div>
                )}
              </div>
              <div className="p-2">
                <div className="font-medium truncate">{p.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.branch || 'Student'} {p.college_name ? `• ${p.college_name}` : ''}
                </div>
                {p.interests && p.interests.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 max-h-8 overflow-hidden">
                    {p.interests.slice(0, 3).map((i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10">
                        {i}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="absolute inset-x-2 bottom-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" onClick={() => handleLike(p.user_id)}>
                  <ThumbsUp className="h-4 w-4 mr-1" /> Like
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
