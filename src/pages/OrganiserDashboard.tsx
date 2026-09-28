import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, FileText, Image, Award, Users, Info, Hash } from "lucide-react";
import { authFetch } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const OrganiserEventForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    details: "",
    category: "community",
    date: "",
    time: "",
    location: "",
    capacity: "",
    points: "",
    organizer: "",
    image: "", // will store URL like /uploads/xxx.png
    photos: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const onChange = (key: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      const res = await authFetch("/api/uploads", {
        method: "POST",
        body: JSON.stringify({ data: dataUrl, filename: file.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.message || "Upload failed");
      }
      // push into photos array and set image to first photo if not set
      setForm(prev => {
        const prevPhotos = Array.isArray((prev as any).photos) ? (prev as any).photos : [];
        return { ...prev, photos: [...prevPhotos, data.url], image: prev.image || data.url } as typeof prev;
      });
      toast({ title: "Image uploaded", description: "Image attached to event.", className: "bg-green-50 border-green-200" });
    } catch (err: any) {
      console.error("Upload failed", err);
      toast({ title: "Image upload failed", description: String(err?.message || err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    // Basic client-side validation for required fields
    if (!form.title.trim()) {
      toast({ title: "Title required", description: "Please enter a title for the event.", variant: "destructive" });
      return;
    }
    if (!form.date) {
      toast({ title: "Date required", description: "Please select a date for the event.", variant: "destructive" });
      return;
    }
    if (!form.location.trim()) {
      toast({ title: "Location required", description: "Please provide the event location.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.shortDescription.trim(),
        details: form.details.trim(),
        category: form.category,
        date: new Date(form.date), // backend expects a Date
        time: form.time.trim(),
        location: form.location.trim(),
        capacity: Number(form.capacity) || 0,
        points: Number(form.points) || 0,
        organizer: form.organizer.trim(),
        image: form.image.trim(),
        photos: Array.isArray(form.photos) ? form.photos : [],
      };
      const res = await authFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
        toast({ title: "Publish failed", description: String(message), variant: "destructive" });
        return;
      }
      toast({ title: "Event Created", description: "Your event is now visible on the Events page.", className: "bg-green-50 border-green-200" });
      // Prune previous events, keep only the most recent one
      try {
        const pruneRes = await authFetch("/api/events/mine/prune", { method: "DELETE" });
        const pruneData = await pruneRes.json().catch(() => ({}));
        if (pruneRes.ok && pruneData?.deleted >= 0) {
          // Optional: toast summary
          if (pruneData.deleted > 0) {
            toast({ title: "Cleaned up older events", description: `${pruneData.deleted} older event(s) removed.`, className: "bg-green-50 border-green-200" });
          }
        }
      } catch {}
      navigate("/events");
    } catch (err) {
      console.error("Publish error:", err);
      toast({ title: "Network or auth error", description: "Ensure you are logged in as organiser and the server is running.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create an Event</h1>
            <p className="text-gray-600">Provide detailed information. This will be shown to all users globally.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Fill out all fields to ensure users have enough context.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Title</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.title} onChange={e => onChange("title", e.target.value)} placeholder="e.g. Urban Tree Planting" required />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Short Description</Label>
                <Input value={form.shortDescription} onChange={e => onChange("shortDescription", e.target.value)} placeholder="One-line summary" />
              </div>

              <div className="md:col-span-2">
                <Label>Detailed Description</Label>
                <Textarea value={form.details} onChange={e => onChange("details", e.target.value)} rows={5} placeholder="Add schedule, requirements, what to bring, etc." />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={val => onChange("category", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleanup">Cleanup</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date</Label>
                <Input type="date" value={form.date} onChange={e => onChange("date", e.target.value)} required />
              </div>

              <div>
                <Label>Time</Label>
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
                  {Array.isArray(form.photos) && form.photos.length > 0 ? (
                    <div className="mt-2 flex items-center gap-3">
                      {form.photos.map((p, idx) => (
                        <img key={p+idx} src={p} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded" />
                      ))}
                    </div>
                  ) : form.image ? (
                    <div className="mt-2 flex items-center gap-3">
                      <img src={form.image} alt="preview" className="h-16 w-16 object-cover rounded" />
                      <span className="text-gray-600">{form.image}</span>
                    </div>
                  ) : null}
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

export default OrganiserEventForm;