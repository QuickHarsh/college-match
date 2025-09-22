/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const QUESTIONS = [
  { id: 1, text: 'Introvert or Extrovert?', options: ['Introvert', 'Extrovert'] },
  { id: 2, text: 'Morning person or Night owl?', options: ['Morning', 'Night'] },
  { id: 3, text: 'Ideal first meet?', options: ['Coffee', 'Walk', 'Movie', 'Club'] },
  { id: 4, text: 'Music vibe?', options: ['Bollywood', 'Indie', 'EDM', 'Hip-hop'] },
  { id: 5, text: 'Weekend plan?', options: ['Gym', 'Study', 'Gaming', 'Travel'] },
  { id: 6, text: 'Pet lover?', options: ['Dogs', 'Cats', 'Both', 'None'] },
  { id: 7, text: 'Food mood?', options: ['Spicy', 'Sweet', 'Savory', 'Healthy'] },
  { id: 8, text: 'Hobby focused?', options: ['Tech', 'Art', 'Sports', 'Books'] },
  { id: 9, text: 'Relationship goal?', options: ['Serious', 'Casual', 'Open', "Don't know"] },
  { id: 10, text: 'Coffee or Chai?', options: ['Coffee', 'Chai'] },
];

export default function Quiz() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const sb: any = supabase as any;
      const { data, error } = await sb
        .from('compatibility_quiz')
        .select('question_id, answer')
        .eq('user_id', user.id);
      if (!error && data) {
        const map: Record<number, string> = {};
        (data as Array<{ question_id: number; answer: string }>).forEach((r) => { map[r.question_id] = r.answer; });
        setAnswers(map);
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const percent = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const sb: any = supabase as any;
      const rows = Object.entries(answers).map(([qid, ans]) => ({ user_id: user.id, question_id: Number(qid), answer: String(ans) }));
      if (rows.length === 0) return;
      const { error } = await sb
        .from('compatibility_quiz')
        .upsert(rows, { onConflict: 'user_id,question_id' });
      if (error) throw error;
      toast({ title: 'Saved!', description: 'Your answers are updated.' });
      if (percent >= 60) toast({ title: 'Great!', description: 'Your compatibility score will now improve.' });
      navigate('/match');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save quiz';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Compatibility Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-2">Complete the quiz to get better matches.</div>
              <Progress value={percent} className="h-2" />
              <div className="text-xs mt-1">{percent}% complete</div>
            </div>

            <div className="space-y-5">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="border rounded-md p-4">
                  <div className="font-medium mb-3">{q.text}</div>
                  <RadioGroup value={answers[q.id] || ''} onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {q.options.map((opt) => (
                        <Label key={opt} className={`border rounded-md p-2 text-center cursor-pointer ${answers[q.id] === opt ? 'bg-primary text-primary-foreground' : ''}`}>
                          <RadioGroupItem value={opt} className="sr-only" />
                          {opt}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save & Continue'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
