import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Clock, Users, Award, Star, Check, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authFetch, useAuth } from "@/lib/auth";

// Helper component to render event image (supports uploaded path like '/uploads/3.png')
const EventImage = ({ src, alt, onClick }: { src: string; alt?: string; onClick?: () => void }) => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  if (!src) return <div className="text-4xl">📅</div>;

  const s = String(src).trim();
  // detect common image indicators: file extensions, uploads path, data URL or http
  const looksLikeImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(s) || s.startsWith('http') || s.startsWith('data:') || s.includes('/uploads') || s.startsWith('uploads') || s.includes('uploads/') || s.startsWith('/uploads/');

  // Build absolute src for server-hosted uploads
  let imgSrc = s;
  if (!s.startsWith('http') && !s.startsWith('data:')) {
    // Ensure leading slash and handle uploads path
    const clean = s.startsWith('/') ? s : `/${s}`;
    imgSrc = `${API_BASE}${clean}`;
  }

  // Force render as image if it looks like an upload path
  const isUploadPath = s.includes('/uploads/') || s.startsWith('uploads/');
  if (isUploadPath && !looksLikeImage) {
    // Override the looksLikeImage check for upload paths
  }

  if (!looksLikeImage && !isUploadPath) {
    // if it's short, treat as emoji/text icon
    if (s.length <= 2) return <div className="text-4xl">{s}</div>;
    // otherwise show the text as fallback
    return <div className="text-sm text-gray-600 break-words max-w-xs">{s}</div>;
  }

  return (
    <img
      src={imgSrc}
      alt={alt || 'event image'}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`w-28 h-28 md:w-32 md:h-32 object-cover rounded-md ${onClick ? 'cursor-pointer' : ''}`}
      onError={(e) => { try { (e.target as HTMLImageElement).src = '/uploads/placeholder.png'; } catch {} }}
    />
  );
};

const Events = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const { user } = useAuth();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoList, setPhotoList] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Load events and registered events from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load all events
        const res = await fetch("/api/events");
        const data = await res.json();
        if (Array.isArray(data)) {
          // Normalize to UI shape
          const mapped = data.map((e: any) => ({
            id: e._id,
            title: e.title,
            description: e.description,
            details: e.details,
            category: e.category || "community",
            points: e.points ?? 0,
            location: e.location || "",
            dateObj: e.date ? new Date(e.date) : null,
            date: e.date ? new Date(e.date).toLocaleDateString() : "",
            time: e.time || "",
            organizer: e.organizer || "",
            participants: Array.isArray(e.participants) ? e.participants.length : (e.participants || 0),
            capacity: e.capacity ?? 0,
            image: (Array.isArray(e.photos) && e.photos.length > 0) ? e.photos[0] : (e.image || "📅"),
            photos: Array.isArray(e.photos) ? e.photos : (e.photos ? [e.photos] : []),
          }));
          setEvents(mapped);
        } else {
          setEvents([]);
        }

        // Load user's registered events
        try {
          const registeredRes = await authFetch("/api/events/my-registered");
          if (registeredRes.ok) {
            const registeredData = await registeredRes.json();
            if (Array.isArray(registeredData)) {
              const registeredIds = registeredData.map((e: any) => e._id);
              setRegisteredEvents(registeredIds);
            }
          } else {
            console.error("Failed to load registered events:", registeredRes.status);
          }
        } catch (regErr) {
          console.error("Failed to load registered events", regErr);
          // Don't set error state, just leave registeredEvents empty
        }
      } catch (err) {
        console.error("Failed to load events", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Separate upcoming vs past based on date
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const upcomingList = events.filter((e: any) => e.dateObj && e.dateObj >= startOfToday);
  const pastList = events.filter((e: any) => e.dateObj && e.dateObj < startOfToday);

  const handleRegisterEvent = async (eventId: string) => {
    try {
      const res = await authFetch(`/api/events/${eventId}/join`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
        toast({ title: "Registration failed", description: String(message), variant: "destructive" });
        return;
      }
      // Update local list with returned event participants count (or optimistically increment)
      setEvents(prev => prev.map(ev => ev.id === eventId ? {
        ...ev,
        participants: Array.isArray(data.participants) ? data.participants.length : (typeof data.participants === 'number' ? data.participants : (ev.participants + 1)),
        capacity: typeof data.capacity === 'number' ? data.capacity : ev.capacity,
      } : ev));
      if (!registeredEvents.includes(eventId)) {
        setRegisteredEvents([...registeredEvents, eventId]);
      }
      const eventObj = events.find(e => e.id === eventId);
      toast({
        title: `Successfully registered for ${eventObj?.title || 'the event'}!`,
        description: "Check your email for event details.",
        className: "bg-green-50 border-green-200",
      });
    } catch (err) {
      toast({ title: "Network or auth error", description: "Please sign in and try again.", variant: "destructive" });
    }
  };


  const handleDownloadPdf = async (event: any) => {
    setPdfLoading(true);
    try {
      const res = await authFetch(`/api/events/${event.id}/download-pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data && (data.message || data.error) ? (data.message || data.error) : `HTTP ${res.status}`;
        toast({ title: 'Download failed', description: String(message), variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safe = (event.title || 'event').replace(/[^a-z0-9\-_. ]/gi, '_');
      a.download = `${safe}_registration.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download started', description: 'PDF is downloading.' });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast({ title: 'Download error', description: 'Could not download PDF', variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadCalendar = async (event: any) => {
    setCalendarLoading(true);
    try {
      const res = await authFetch(`/api/events/${event.id}/download-calendar`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data && (data.message || data.error) ? (data.message || data.error) : `HTTP ${res.status}`;
        toast({ title: 'Download failed', description: String(message), variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safe = (event.title || 'event').replace(/[^a-z0-9\-_. ]/gi, '_');
      a.download = `${safe}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Calendar downloaded', description: 'Add this to your calendar.' });
    } catch (err) {
      console.error('Error downloading calendar:', err);
      toast({ title: 'Download error', description: 'Could not download calendar', variant: 'destructive' });
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleSaveEvent = (eventId: string) => {
    if (!savedEvents.includes(eventId)) {
      setSavedEvents([...savedEvents, eventId]);
      toast({
        title: "Event Saved",
        description: "Added to your saved events.",
      });
    } else {
      setSavedEvents(savedEvents.filter(id => id !== eventId));
      toast({
        title: "Event Removed",
        description: "Removed from your saved events.",
      });
    }
  };

  const isEventFull = (event: any) => {
    const cap = Number(event.capacity) || 0;
    if (cap <= 0) return false; // unlimited
    return Number(event.participants) >= cap;
  };

  const isEventSaved = (eventId: string) => {
    return savedEvents.includes(eventId);
  };

  const isEventRegistered = (eventId: string) => {
    return registeredEvents.includes(eventId);
  };

  const getEventStatusBadge = (event: any) => {
    if (isEventFull(event)) {
      return <Badge variant="outline" className="text-red-600">Closed</Badge>;
    }
    
    const spotsLeft = event.capacity - event.participants;
    if (spotsLeft <= 5) {
      return <Badge className="bg-orange-100 text-orange-800">{spotsLeft} spots left</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Open</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "cleanup":
        return <Badge className="bg-blue-100 text-blue-800">Cleanup</Badge>;
      case "workshop":
        return <Badge className="bg-purple-100 text-purple-800">Workshop</Badge>;
      case "planting":
        return <Badge className="bg-green-100 text-green-800">Planting</Badge>;
      case "collection":
        return <Badge className="bg-orange-100 text-orange-800">Collection</Badge>;
      case "community":
        return <Badge className="bg-yellow-100 text-yellow-800">Community</Badge>;
      case "education":
        return <Badge className="bg-cyan-100 text-cyan-800">Education</Badge>;
      default:
        return <Badge variant="outline">Event</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events & NGO Collabs</h1>
            <p className="text-gray-600">Participate in environmental activities and earn points</p>
          </div>
        </div>

        {/* Event Tabs */}
        <div className="flex space-x-2 border-b">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("upcoming")}
            className={`${
              activeTab === "upcoming" 
                ? "border-b-2 border-green-600 text-green-600" 
                : ""
            } rounded-none`}
          >
            Upcoming Events
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("registered")}
            className={`${
              activeTab === "registered" 
                ? "border-b-2 border-green-600 text-green-600" 
                : ""
            } rounded-none`}
          >
            My Registrations
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("past")}
            className={`${
              activeTab === "past" 
                ? "border-b-2 border-green-600 text-green-600" 
                : ""
            } rounded-none`}
          >
            Past Events
          </Button>
        </div>

        {/* Event List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === "upcoming" && (
            loading ? (
              <div className="col-span-full py-12 text-center text-gray-500">Loading events...</div>
            ) : upcomingList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500">No events yet. Check back soon!</div>
            ) : upcomingList.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between">
                    <div className="flex space-x-3 items-start">
                      <EventImage src={event.image} alt={event.title} onClick={async () => {
                        // open modal and load photos for this event
                        setPhotoList([]);
                        setPhotoIndex(0);
                        setPhotoModalOpen(true);
                        try {
                          const res = await fetch(`/api/events/${event.id}/photos`);
                          if (res.ok) {
                            const data = await res.json();
                            if (Array.isArray(data)) setPhotoList(data);
                          }
                        } catch (e) {
                          console.warn('Failed to load event photos', e);
                        }
                      }} />
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {getCategoryBadge(event.category)}
                          {getEventStatusBadge(event)}
                        </div>
                      </div>
                    </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEvent(event.id);
                    }}
                    className={isEventSaved(event.id) ? "text-yellow-500" : "text-gray-400"}
                  >
                    <Star className="h-5 w-5" />
                  </Button>
                </div>
                <CardDescription className="mt-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{event.participants} registered{event.capacity ? ` of ${event.capacity} spots` : ""}</span>
                  </div>
                  {Number(event.capacity) > 0 && (
                    <div className="mt-1">
                      <div className="h-2 w-full bg-gray-200 rounded">
                        <div
                          className={`h-2 rounded ${isEventFull(event) ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, Math.round((Number(event.participants) / Number(event.capacity)) * 100))}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span>{event.participants} of {event.capacity} filled</span>
                        <span>•</span>
                        <span>{Math.max(0, Number(event.capacity) - Number(event.participants))} spots left</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPdf(event)}
                    disabled={!isEventRegistered(event.id) || pdfLoading}
                  >
                    {pdfLoading ? 'Generating...' : 'Download Details'}
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    handleRegisterEvent(event.id);
                    setSelectedEvent(event);
                  }}
                  disabled={isEventFull(event) || isEventRegistered(event.id)}
                  className={
                    isEventFull(event)
                      ? "bg-gray-400"
                      : isEventRegistered(event.id)
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {isEventFull(event)
                    ? 'Closed'
                    : isEventRegistered(event.id)
                    ? 'Registered'
                    : 'Register Now'}
                </Button>
              </CardFooter>
            </Card>
            ))
          )}

          {activeTab === "registered" && (
            <>
              {registeredEvents.length > 0 ? (
                events
                  .filter(event => registeredEvents.includes(event.id))
                  .map(event => (
                    <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between">
                          <div className="flex space-x-3 items-start">
                            <EventImage src={event.image} alt={event.title} />
                            <div>
                              <CardTitle className="text-lg">{event.title}</CardTitle>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {getCategoryBadge(event.category)}
                                <Badge className="bg-blue-100 text-blue-800">Registered</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Award className="h-4 w-4 text-green-500" />
                            <span>{event.points} points on completion</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-2 items-center">
                        <div className="flex flex-wrap gap-2 flex-1 sm:flex-none items-center">
                          <Button
                            variant="outline"
                            onClick={() => handleDownloadPdf(event)}
                            disabled={pdfLoading}
                          >
                            {pdfLoading ? 'Generating...' : 'Download Details'}
                          </Button>
                          <Button variant="outline" onClick={() => handleDownloadCalendar(event)}>
                            Add to Calendar
                          </Button>
                        </div>
                          <Button variant="outline" className="text-red-600 w-full sm:w-auto whitespace-nowrap min-w-[160px]" onClick={async () => {
                          try {
                            const res = await authFetch(`/api/events/${event.id}/leave`, { method: 'POST' });
                            const data = await res.json().catch(()=>({}));
                            if (!res.ok) {
                              toast({ title: 'Cancel failed', description: data.message || `HTTP ${res.status}`, variant: 'destructive' });
                              return;
                            }
                            // update UI: decrement participants and remove from registeredEvents
                            setEvents(prev => prev.map(ev => ev.id === event.id ? ({ ...ev, participants: Math.max(0, ev.participants - 1) }) : ev));
                            setRegisteredEvents(prev => prev.filter(id => id !== event.id));
                            toast({ title: 'Registration cancelled', description: 'You have been removed from the event.' });
                          } catch (err) {
                            console.error('Error cancelling registration', err);
                            toast({ title: 'Network error', description: 'Could not cancel registration', variant: 'destructive' });
                          }
                        }}>
                          Cancel Registration
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No Registrations Yet</h3>
                  <p className="text-gray-500 mb-6">You haven't registered for any upcoming events</p>
                  <Button
                    onClick={() => setActiveTab("upcoming")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Browse Events
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === "past" && (
            loading ? (
              <div className="col-span-full py-12 text-center text-gray-500">Loading events...</div>
            ) : pastList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500">No past events.</div>
            ) : pastList.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between">
                  <div className="flex space-x-3 items-start">
                    <EventImage src={event.image} alt={event.title} />
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {getCategoryBadge(event.category)}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline">
                  View Photos
                </Button>
              </CardFooter>
            </Card>
          )))}
        </div>

        {/* NGO Partners */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">NGO Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clean Earth Initiative</CardTitle>
                <CardDescription>Environmental conservation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Working to protect natural habitats and reduce pollution through community action.
                </p>
                <Button variant="outline" className="w-full">View Profile</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Future Forest Foundation</CardTitle>
                <CardDescription>Reforestation projects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Dedicated to planting trees and restoring forests around the world.
                </p>
                <Button variant="outline" className="w-full">View Profile</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ocean Guardians</CardTitle>
                <CardDescription>Marine conservation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Protecting marine ecosystems through education, cleanup, and policy advocacy.
                </p>
                <Button variant="outline" className="w-full">View Profile</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registration Success Dialog */}
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Registration Successful!</span>
                </DialogTitle>
                <DialogDescription>
                  You're all set for {selectedEvent.title}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">{selectedEvent.date}, {selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">{selectedEvent.location}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  We've sent the event details to your email. Remember to check in when you arrive to earn {selectedEvent.points} eco-points!
                </p>
                
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPdf(selectedEvent)}
                      disabled={pdfLoading}
                    >
                      {pdfLoading ? 'Generating...' : 'Download Details'}
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadCalendar(selectedEvent)} disabled={calendarLoading}>
                      {calendarLoading ? 'Adding...' : 'Add to Calendar'}
                    </Button>
                  </div>
                  <Button
                    onClick={() => setSelectedEvent(null)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Got It
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Photo modal for event images */}
      <Dialog open={photoModalOpen} onOpenChange={(open) => { if (!open) { setPhotoModalOpen(false); setPhotoList([]); } }}>
        <DialogContent className="sm:max-w-3xl w-full max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Event Photos</DialogTitle>
            <DialogDescription>Browse uploaded photos by the organiser</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {photoList.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">No photos available</div>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setPhotoIndex(i => Math.max(0, i-1))} disabled={photoIndex <= 0}>
                  ◀
                </Button>
                <div className="flex-1">
                  <img src={photoList[photoIndex].startsWith('/') ? `${import.meta.env.VITE_API_BASE || ''}${photoList[photoIndex]}` : photoList[photoIndex]} alt={`photo-${photoIndex}`} className="w-full h-96 object-contain" />
                </div>
                <Button variant="ghost" onClick={() => setPhotoIndex(i => Math.min(photoList.length - 1, i+1))} disabled={photoIndex >= photoList.length - 1}>
                  ▶
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setPhotoModalOpen(false)} className="bg-green-600 hover:bg-green-700">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Events;