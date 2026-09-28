import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Event {
  id: number;
  name: string;
  date: string;
  participants: number;
}

const OrganiserDashboard = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);
  
  // Dashboard stats
  const stats = [
    { name: 'Total Events', value: '12', change: '+2.5%', changeType: 'positive' },
    { name: 'Upcoming Events', value: '5', change: '+1', changeType: 'positive' },
    { name: 'Participants', value: '342', change: '+12%', changeType: 'positive' },
    { name: 'Avg. Rating', value: '4.8', change: '+0.2', changeType: 'positive' },
  ];
  const recentEvents: Event[] = [
    { id: 1, name: 'Community Cleanup', date: '2023-06-15', participants: 45 },
    { id: 2, name: 'Tree Planting', date: '2023-06-10', participants: 32 },
    { id: 3, name: 'Recycling Workshop', date: '2023-06-05', participants: 28 },
  ];
  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Organiser Dashboard"
      actionButton={{
        label: "New Event",
        onClick: () => navigate('/organiser/events/new'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        )
      }}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <div className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Your most recently created events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()} • {event.participants} participants
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    View
                    View all events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
                <Input placeholder="e.g. 10:00 AM - 1:00 PM" value={form.time} onChange={e => onChange("time", e.target.value)} />
              </div>

              <div>
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</Label>
                <Input placeholder="Venue / Address" value={form.location} onChange={e => onChange("location", e.target.value)} />
              </div>

              <div>
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Capacity</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onChange("capacity", String(Math.max(0, (Number(form.capacity)||0) - 1)))}>-</Button>
                  <Input className="w-full" type="number" min="0" placeholder="e.g. 100" value={form.capacity} onChange={e => onChange("capacity", e.target.value)} />
                  <Button type="button" variant="outline" onClick={() => onChange("capacity", String((Number(form.capacity)||0) + 1))}>+</Button>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2"><Award className="h-4 w-4" /> Points</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onChange("points", String(Math.max(0, (Number(form.points)||0) - 5)))}>-5</Button>
                  <Input className="w-full" type="number" min="0" placeholder="e.g. 100" value={form.points} onChange={e => onChange("points", e.target.value)} />
                  <Button type="button" variant="outline" onClick={() => onChange("points", String((Number(form.points)||0) + 5))}>+5</Button>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2"><Info className="h-4 w-4" /> Organizer</Label>
                <Input placeholder="Organisation / Name" value={form.organizer} onChange={e => onChange("organizer", e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> Image</Label>
                {/* Drag & drop zone */}
                <div
                  className={`mt-2 border-2 border-dashed rounded-md p-4 text-sm ${dragOver ? "border-purple-400 bg-purple-50" : "border-gray-300"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) uploadImage(file); }}
                >
                  <p>Drag and drop an image here, or choose a file below.</p>
                  {form.image && (
                    <div className="mt-2 flex items-center gap-3">
                      <img src={form.image} alt="preview" className="h-16 w-16 object-cover rounded" />
                      <span className="text-gray-600">{form.image}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
                  />
                  <Button type="button" variant="outline" disabled={uploading} onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (f) uploadImage(f); };
                    input.click();
                  }}>{uploading ? "Uploading..." : "Choose File"}</Button>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/events")}>Cancel</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  {loading ? "Publishing..." : "Publish Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrganiserDashboard;
