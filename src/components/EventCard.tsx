import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { registerForEvent, isUserRegistered } from '@/services/eventRegistration';
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    maxAttendees: number;
    currentAttendees: number;
  };
  showRegisterButton?: boolean;
  onRegister?: () => void;
}

export default function EventCard({ event, showRegisterButton = true, onRegister }: EventCardProps) {
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(
    user ? isUserRegistered(event.id, user.id) : false
  );
  const isPastEvent = new Date(event.date) < new Date();

  const handleRegister = async () => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }

    try {
      setIsRegistering(true);
      await registerForEvent(event.id, user.id);
      setIsRegistered(true);
      if (onRegister) onRegister();
    } catch (error) {
      console.error('Error registering for event:', error);
      // Show error toast
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{format(new Date(event.date), 'PPP p')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="mr-2 h-4 w-4" />
            <span>{event.currentAttendees} / {event.maxAttendees} attendees</span>
          </div>
          <p className="text-gray-700">
            {event.description.length > 150 
              ? `${event.description.substring(0, 150)}...` 
              : event.description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        {isPastEvent ? (
          <span className="text-sm text-gray-500">Event ended</span>
        ) : isRegistered ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-1" />
            <span>Registered</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">
            {event.maxAttendees - event.currentAttendees} spots left
          </span>
        )}
        
        {showRegisterButton && !isRegistered && !isPastEvent && (
          <Button 
            onClick={handleRegister}
            disabled={isRegistering || event.currentAttendees >= event.maxAttendees}
            className="ml-auto"
          >
            {isRegistering ? 'Registering...' : 'Register Now'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
