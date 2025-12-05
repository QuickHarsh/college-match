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

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  banner_image_url: string | null;
  start_time: string | null;
  end_time: string | null;
  is_hot: boolean;
}

export default function AdminEvents() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [form, setForm] = useState<Partial<EventRow>>({});
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const sb: any = supabase as any;
      const { data, error } = await sb
        .from('events')
        .select('id, title, description, location, banner_image_url, start_time, end_time, is_hot')
        .order('start_time', { ascending: true });
      if (error) throw error;
      setRows((data as EventRow[]) || []);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ title: '', description: '', location: '', banner_image_url: '', start_time: '', end_time: '' });
  };

  const submit = async () => {
    try {
      if (!form.title) throw new Error('Title is required');
      if (!form.start_time) throw new Error('Start Time is required');

      // Ensure dates are ISO formatted if present
      const formatToISO = (dateStr?: string | null) => {
        if (!dateStr) return null;
        return new Date(dateStr).toISOString();
      };

      // Derive event_date (YYYY-MM-DD) from start_time
      const eventDate = form.start_time ? new Date(form.start_time).toISOString().split('T')[0] : null;

      const payload = {
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        banner_image_url: form.banner_image_url || null,
        start_time: formatToISO(form.start_time),
        end_time: formatToISO(form.end_time),
        event_date: eventDate,
        is_hot: form.is_hot || false,
      } as any;

      console.log('Submitting payload:', payload);

      const sb: any = supabase as any;
      setSaving(true);
      if (editing) {
        const { error } = await sb.from('events').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Event updated successfully.' });
      } else {
        const { error } = await sb.from('events').insert(payload);
        if (error) throw error;
        toast({ title: 'Created', description: 'Event created successfully.' });
      }
      await load();
      resetForm();
    } catch (e: any) {
      console.error('Submit Error:', e);
      toast({
        title: 'Error',
        description: e.message || e.details || 'Failed to save',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      setDeletingId(id);
      const sb: any = supabase as any;
      const { error } = await sb.from('events').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Event deleted.' });
      await load();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', location: '', banner_image_url: '', start_time: '', end_time: '' });
  };

  const startEdit = (row: EventRow) => {
    setEditing(row);
    setForm({ ...row });
  };

  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const sb: any = supabase as any;
      const { error: uploadError } = await sb.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = sb.storage
        .from('banners')
        .getPublicUrl(filePath);

      setForm(f => ({ ...f, banner_image_url: publicUrl }));
      toast({ title: 'Uploaded', description: 'Image uploaded successfully.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20 p-4">
        <div className="container mx-auto max-w-6xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Events</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin')}>Back</Button>
              <Button onClick={startCreate}>New Event</Button>
            </div>
          </div>

          {/* Form */}
          {(editing || form.title !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle>{editing ? 'Edit Event' : 'Create Event'}</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={form.location || ''} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <Label>Banner Image URL</Label>
                  <div className="flex gap-2">
                    <Input value={form.banner_image_url || ''} onChange={(e) => setForm((f) => ({ ...f, banner_image_url: e.target.value }))} placeholder="https://..." />
                    <Input type="file" className="w-[100px]" onChange={handleUpload} disabled={uploading} />
                  </div>
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input type="datetime-local" value={form.start_time || ''} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="datetime-local" value={form.end_time || ''} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_hot"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={form.is_hot || false}
                    onChange={(e) => setForm((f) => ({ ...f, is_hot: e.target.checked }))}
                  />
                  <Label htmlFor="is_hot" className="cursor-pointer">Hot Event (Show in Home Carousel)</Label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Create')}</Button>
                  <Button variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List */}
          <div className="grid gap-3">
            {loading && <div className="text-sm text-muted-foreground">Loading events…</div>}
            {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {row.title}
                      {row.is_hot && <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-orange-200">🔥 Hot</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{row.location || 'TBD'} • {row.start_time ? new Date(row.start_time).toLocaleString() : 'n/a'}</div>
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
