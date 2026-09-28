export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  category?: string;
  photos?: string[];
}
