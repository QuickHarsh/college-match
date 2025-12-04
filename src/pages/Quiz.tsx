/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MagnetLines from '@/reactbits/MagnetLines';
import SpotlightCard from '@/reactbits/SpotlightCard';
import ShinyText from '@/reactbits/ShinyText';

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
    <div className="min-h-screen bg-background relative overflow-hidden pt-20">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <MagnetLines rows={10} columns={10} containerSize="100%" lineColor="rgba(147, 51, 234, 0.2)" lineWidth="1px" lineHeight="40px" baseAngle={0} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="container mx-auto max-w-4xl p-6 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">
              <ShinyText text="Compatibility Quiz" disabled={false} speed={3} className="inline-block" />
            </h1>
            <p className="text-muted-foreground">Answer these to find your perfect match.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{percent}%</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        <div className="sticky top-4 z-50 mb-8 bg-background/80 backdrop-blur-md p-4 rounded-2xl border shadow-sm">
          <Progress value={percent} className="h-3 bg-secondary" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {QUESTIONS.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SpotlightCard className="h-full bg-card/50 backdrop-blur-sm border-white/5" spotlightColor="rgba(168, 85, 247, 0.1)">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {q.id}
                    </div>
                    <div className="font-semibold text-lg">{q.text}</div>
                  </div>

                  <RadioGroup value={answers[q.id] || ''} onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt) => (
                        <Label
                          key={opt}
                          className={`relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${answers[q.id] === opt
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                            }`}
                        >
                          <RadioGroupItem value={opt} className="sr-only" />
                          <span>{opt}</span>
                          {answers[q.id] === opt && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </motion.div>
                          )}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-auto flex items-center justify-end gap-4 z-50">
          <Button variant="outline" size="lg" onClick={() => navigate(-1)} className="rounded-full shadow-lg bg-background/80 backdrop-blur-md">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button size="lg" onClick={save} disabled={saving} className="rounded-full shadow-lg shadow-primary/25 px-8">
            {saving ? 'Saving...' : 'Save & Find Matches'} <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
