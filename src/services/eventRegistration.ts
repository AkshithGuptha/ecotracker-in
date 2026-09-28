import { Event } from "@/types/event";

type Registration = {
  eventId: string;
  userId: string;
  registeredAt: Date;
  status: 'registered' | 'attended' | 'cancelled';
};

// In a real app, this would be an API call to your backend
const registrations: Record<string, Registration> = {};

export const registerForEvent = async (eventId: string, userId: string): Promise<Registration> => {
  const registration: Registration = {
    eventId,
    userId,
    registeredAt: new Date(),
    status: 'registered'
  };
  
  // In a real app, this would be an API call
  registrations[`${eventId}-${userId}`] = registration;
  
  // Save to local storage for demo purposes
  const userRegistrations = JSON.parse(localStorage.getItem('userRegistrations') || '{}');
  userRegistrations[`${eventId}-${userId}`] = registration;
  localStorage.setItem('userRegistrations', JSON.stringify(userRegistrations));
  
  return registration;
};

export const getUserRegistrations = (userId: string): Registration[] => {
  // Get from local storage for demo purposes
  const userRegistrations = JSON.parse(localStorage.getItem('userRegistrations') || '{}');
  return Object.values(userRegistrations).filter(
    (reg: any) => reg.userId === userId
  ) as Registration[];
};

export const isUserRegistered = (eventId: string, userId: string): boolean => {
  const userRegistrations = JSON.parse(localStorage.getItem('userRegistrations') || '{}');
  return !!userRegistrations[`${eventId}-${userId}`];
};

export const cancelRegistration = async (eventId: string, userId: string): Promise<void> => {
  const userRegistrations = JSON.parse(localStorage.getItem('userRegistrations') || '{}');
  const key = `${eventId}-${userId}`;
  if (userRegistrations[key]) {
    userRegistrations[key].status = 'cancelled';
    localStorage.setItem('userRegistrations', JSON.stringify(userRegistrations));
  }
};
