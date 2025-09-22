/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AdminGuard from '@/components/AdminGuard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="container mx-auto max-w-5xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Create and manage campus events (banners, dates, descriptions).</p>
                <Button onClick={() => navigate('/admin/events')}>Manage Events</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clubs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Create and manage interest clubs with categories and icons.</p>
                <Button onClick={() => navigate('/admin/clubs')}>Manage Clubs</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Broadcast campus-wide messages to all students.</p>
                <Button onClick={() => navigate('/admin/announcements')}>Manage Announcements</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
