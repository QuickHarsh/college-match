/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminGuard from '@/components/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Array<{ id: string; message: string; active: boolean; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const sb: any = supabase as any;
      const { data } = await sb
        .from('announcements')
        .select('id, message, active, created_at')
        .order('created_at', { ascending: false });
      setItems((data || []) as any);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createAnnouncement = async () => {
    if (!message.trim()) return;
    try {
      setSaving(true);
      const sb: any = supabase as any;
      const { error } = await sb.from('announcements').insert({ message: message.trim(), active: false });
      if (error) throw error;
      toast({ title: 'Created', description: 'Announcement created (inactive).' });
      setMessage('');
      await load();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to create announcement', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, next: boolean) => {
    try {
      setTogglingId(id);
      const sb: any = supabase as any;
      if (next) {
        // Ensure only one active at a time: deactivate others first
        const { error: e1 } = await sb.from('announcements').update({ active: false }).neq('id', id);
        if (e1) throw e1;
      }
      const { error } = await sb.from('announcements').update({ active: next }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: next ? 'Announcement activated.' : 'Announcement deactivated.' });
      await load();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      setDeletingId(id);
      const sb: any = supabase as any;
      const { error } = await sb.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Announcement removed.' });
      await load();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20 p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h1 className="text-2xl font-bold">Announcements</h1>
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create new</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <textarea
                  placeholder="Write a campus-wide announcement..."
                  className="w-full min-h-[80px] rounded-md border bg-background p-2 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button onClick={createAnnouncement} disabled={!message.trim() || saving}>{saving ? 'Posting…' : 'Post'}</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Tip: Keep it short. Only one or two lines appear on the home banner.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground">No announcements yet.</div>
                )}
                {items.map((it) => (
                  <div key={it.id} className="flex items-start gap-3 rounded-md border p-3">
                    <div className="pt-0.5">
                      {it.active ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm whitespace-pre-wrap">{it.message}</div>
                      <div className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={it.active ? 'secondary' : 'default'} onClick={() => toggleActive(it.id, !it.active)} disabled={togglingId === it.id}>
                        {togglingId === it.id ? 'Saving…' : it.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteAnnouncement(it.id)} disabled={deletingId === it.id}>
                        {deletingId === it.id ? 'Deleting…' : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}
