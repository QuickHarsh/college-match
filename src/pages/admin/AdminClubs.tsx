/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
}

export default function AdminClubs() {
  const [rows, setRows] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ClubRow | null>(null);
  const [form, setForm] = useState<Partial<ClubRow>>({});
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const sb: any = supabase as any;
      const { data, error } = await sb
        .from('interest_clubs')
        .select('id, name, description, icon, category')
        .order('name', { ascending: true });
      if (error) throw error;
      setRows((data as ClubRow[]) || []);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load clubs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '', category: '' });
  };

  const submit = async () => {
    try {
      if (!form.name) throw new Error('Name is required');
      const payload = {
        name: form.name,
        description: form.description || null,
        icon: form.icon || null,
        category: form.category || null,
      } as any;
      const sb: any = supabase as any;
      setSaving(true);
      if (editing) {
        const { error } = await sb.from('interest_clubs').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Club updated successfully.' });
      } else {
        const { error } = await sb.from('interest_clubs').insert(payload);
        if (error) throw error;
        toast({ title: 'Created', description: 'Club created successfully.' });
      }
      await load();
      resetForm();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this club?')) return;
    try {
      setDeletingId(id);
      const sb: any = supabase as any;
      const { error } = await sb.from('interest_clubs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Club deleted.' });
      await load();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '', category: '' });
  };

  const startEdit = (row: ClubRow) => {
    setEditing(row);
    setForm({ ...row });
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="container mx-auto max-w-6xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Clubs</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin')}>Back</Button>
              <Button onClick={startCreate}>New Club</Button>
            </div>
          </div>

          {(editing || form.name !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle>{editing ? 'Edit Club' : 'Create Club'}</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={form.category || ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Anime / Tech / Fitness / Music" />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Icon (emoji or URL)</Label>
                  <Input value={form.icon || ''} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="e.g., 🎮 or https://..." />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Create')}</Button>
                  <Button variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3">
            {loading && <div className="text-sm text-muted-foreground">Loading clubs…</div>}
            {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">No clubs yet.</div>}
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.category || 'Uncategorized'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => startEdit(row)} disabled={deletingId === row.id}>Edit</Button>
                    <Button variant="destructive" onClick={() => remove(row.id)} disabled={deletingId === row.id}>{deletingId === row.id ? 'Deleting…' : 'Delete'}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
