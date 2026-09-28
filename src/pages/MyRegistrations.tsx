import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getUserRegistrations, cancelRegistration } from '@/services/eventRegistration';
import { getEvents } from '@/services/events';
import { Event } from '@/types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Eye, X } from 'lucide-react';

interface EventWithRegistration extends Event {
  registrationDate: Date;
  status: string;
}

export default function MyRegistrations() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        const registrations = getUserRegistrations(user.id);
        const allEvents = await getEvents();
        
        const userEvents: EventWithRegistration[] = registrations.map(reg => {
          const event = allEvents.find(e => e.id === reg.eventId);
          return event ? {
            ...event,
            registrationDate: new Date(reg.registeredAt),
            status: reg.status
          } as unknown as EventWithRegistration : null;
        }).filter(Boolean) as EventWithRegistration[];
        
        setEvents(userEvents);
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);

  const upcomingEvents = events.filter(event => new Date(event.date) > new Date());
  const pastEvents = events.filter(event => new Date(event.date) <= new Date());

  if (isLoading) {
    return <div>Loading your registrations...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Event Registrations</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} isPast={false} />
            ))
          ) : (
            <p>No upcoming registered events.</p>
          )}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastEvents.length > 0 ? (
            pastEvents.map(event => (
              <EventCard key={event.id} event={event} isPast={true} />
            ))
          ) : (
            <p>No past events.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, isPast }: { event: EventWithRegistration, isPast: boolean }) {
  const [showPhotos, setShowPhotos] = useState(false);
  const { user } = useAuth();

  const handleCancelRegistration = async () => {
    if (!user) return;
    try {
      await cancelRegistration(event.id, user.id);
      // Refresh the page or update state to reflect cancellation
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{event.title}</CardTitle>
          {event.photos && event.photos.length > 0 && (
            <Dialog open={showPhotos} onOpenChange={setShowPhotos}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Photos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Event Photos</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {event.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Event photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(event.date), 'PPP')} • {event.location}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-gray-700 mb-4">{event.description}</p>
        <div className="mt-auto">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            isPast ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'
          }`}>
            {isPast ? 'Completed' : 'Registered'}
          </span>
          <div className="mt-2 text-sm text-gray-500">
            Registered on: {format(new Date(event.registrationDate), 'PPP')}
          </div>
          {!isPast && event.status !== 'cancelled' && (
            <Button
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={handleCancelRegistration}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel Registration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
