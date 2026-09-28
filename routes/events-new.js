import express from "express";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all events
router.get("/", async (req,res)=>{
  try {
    const { userId } = req.query;
    let query = { isActive: true };

    if (userId) {
      // Get events created by this user or events where user is a participant
      query = {
        $and: [
          { isActive: true },
          {
            $or: [
              { organizerId: userId },
              { 'participants.userId': userId }
            ]
          }
        ]
      };
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Get user's registered events
router.get("/my-registered", auth, async (req, res) => {
  try {
    const events = await Event.find({
      'participants.userId': req.user.id,
      isActive: true
    }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching registered events:', err);
    res.status(500).json({ message: 'Error fetching registered events' });
  }
});

// Create new event (organiser)
router.post("/", auth, async (req,res)=>{
  try {
    const {
      title,
      description,
      details,
      category,
      date,
      time,
      location,
      capacity,
      points,
      image,
    } = req.body;

    const event = new Event({
      title,
      description,
      details,
      category,
      date,
      time,
      location,
      capacity,
      points,
      organizerId: req.user.id,
      organizerName: req.user.name || req.user.organizationName || 'Unknown Organizer',
      image,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Error creating event' });
  }
});

// Update event
router.put("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Error updating event' });
  }
});

// Delete event
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// Join event
router.post("/:id/join", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is full
    if (event.capacity > 0 && event.participants.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if user is already registered
    const isAlreadyRegistered = event.participants.some(p => p.userId.toString() === req.user.id);
    if (isAlreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Add user to participants
    event.participants.push({
      userId: req.user.id,
      registeredAt: new Date()
    });
    await event.save();

    res.json({
      message: 'Successfully registered for event',
      participants: event.participants.length,
      capacity: event.capacity
    });
  } catch (err) {
    console.error('Error joining event:', err);
    res.status(500).json({ message: 'Error joining event' });
  }
});

// Leave event
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove user from participants
    event.participants = event.participants.filter(p => p.userId.toString() !== req.user.id);
    await event.save();

    res.json({
      message: 'Successfully left event',
      participants: event.participants.length,
      capacity: event.capacity
    });
  } catch (err) {
    console.error('Error leaving event:', err);
    res.status(500).json({ message: 'Error leaving event' });
  }
});

// Get single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event' });
  }
});

export default router;
