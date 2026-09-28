import { Event } from '@/types/event';

// Mock data for demonstration
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Community Cleanup',
    description: 'Join us for a day of cleaning up the local park and surrounding areas.',
    date: '2023-12-15T09:00:00',
    location: 'Central Park',
    maxAttendees: 50,
    currentAttendees: 23,
    organizerId: 'org-1',
    createdAt: '2023-11-01T10:00:00',
    updatedAt: '2023-11-01T10:00:00',
    imageUrl: '/images/cleanup.jpg',
    category: 'Environment'
  },
  {
    id: '2',
    title: 'Tree Planting Initiative',
    description: 'Help us plant 100 trees in the local community.',
    date: '2023-12-20T10:00:00',
    location: 'Riverside Area',
    maxAttendees: 30,
    currentAttendees: 15,
    organizerId: 'org-2',
    createdAt: '2023-11-05T14:30:00',
    updatedAt: '2023-11-05T14:30:00',
    imageUrl: '/images/tree-planting.jpg',
    category: 'Environment'
  },
  {
    id: '3',
    title: 'Recycling Workshop',
    description: 'Learn about proper recycling practices and how to reduce waste.',
    date: '2024-01-10T15:00:00',
    location: 'Community Center',
    maxAttendees: 40,
    currentAttendees: 12,
    organizerId: 'org-1',
    createdAt: '2023-11-10T09:15:00',
    updatedAt: '2023-11-10T09:15:00',
    imageUrl: '/images/recycling.jpg',
    category: 'Education'
  }
];

// Get all events
export const getEvents = async (): Promise<Event[]> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockEvents]);
    }, 500);
  });
};

// Get a single event by ID
export const getEventById = async (id: string): Promise<Event | undefined> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const event = mockEvents.find(event => event.id === id);
      resolve(event ? { ...event } : undefined);
    }, 300);
  });
};

// Create a new event
export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const newEvent: Event = {
        ...eventData,
        id: `event-${Date.now()}`,
        currentAttendees: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockEvents.push(newEvent);
      resolve(newEvent);
    }, 500);
  });
};

// Update an existing event
export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event | undefined> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockEvents.findIndex(event => event.id === id);
      if (index !== -1) {
        const updatedEvent = {
          ...mockEvents[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        mockEvents[index] = updatedEvent;
        resolve(updatedEvent);
      } else {
        resolve(undefined);
      }
    }, 500);
  });
};

// Delete an event
export const deleteEvent = async (id: string): Promise<boolean> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockEvents.findIndex(event => event.id === id);
      if (index !== -1) {
        mockEvents.splice(index, 1);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};
