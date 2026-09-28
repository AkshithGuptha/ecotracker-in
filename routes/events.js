import express from "express";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";
import Registration from "../models/Registration.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { createEvent } from "ics";

const router = express.Router();

// Get all events
router.get("/", async (req, res) => {
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
router.post("/", auth, async (req, res) => {
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
      photos,
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
      photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
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
    const registeredAt = new Date();
    event.participants.push({
      userId: req.user.id,
      registeredAt
    });
    await event.save();

    // Create a registration record for analytics/audit
    try {
      await Registration.create({
        userId: req.user.id,
        userName: req.user.name || req.user.username || '',
        userEmail: req.user.email || '',
        eventId: event._id,
        registeredAt
      });
    } catch (regErr) {
      console.warn('Failed to create registration record:', regErr);
    }

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

// Get event photos
router.get("/:id/photos", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('photos');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(Array.isArray(event.photos) ? event.photos : []);
  } catch (err) {
    console.error('Error fetching event photos:', err);
    res.status(500).json({ message: 'Error fetching photos' });
  }
});

// Download event registration PDF
router.get("/:id/download-pdf", auth, async (req, res) => {
  try {
    console.debug(`[events] download-pdf requested for id=${req.params.id} by user=${req.user?.id || 'unknown'}`);
    const event = await Event.findById(req.params.id);
    if (!event) {
      console.warn(`[events] download-pdf: event not found id=${req.params.id}`);
      return res.status(404).json({ message: "Event not found", id: req.params.id });
    }

    const participant = event.participants.find(
      (p) => p.userId.toString() === req.user.id
    );
    if (!participant) {
      console.warn(`[events] download-pdf: user ${req.user.id} is not a participant of event ${req.params.id}`);
      return res.status(403).json({ message: "You are not registered for this event" });
    }

    const doc = new PDFDocument();
    const safeTitle = String(event.title).replace(/[^a-z0-9\-_. ]/gi, '_');
    const fileName = `event_${event._id}_${req.user.id}.pdf`;
    const tempDir = path.join(process.cwd(), 'temp');
    const filePath = path.join(tempDir, fileName);

    // Ensure temp directory exists
    fs.mkdirSync(tempDir, { recursive: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // PDF Content
    doc.fontSize(20).text("Event Registration Confirmation", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Event: ${event.title}`);
    doc.text(`Date: ${event.date}`);
    doc.text(`Time: ${event.time}`);
    doc.text(`Location: ${event.location}`);
    doc.text(`Points: ${event.points}`);
    doc.moveDown();
    doc.text(`Participant: ${req.user.email || req.user.name || req.user.id}`);
    doc.text(`Registration Date: ${participant.registeredAt ? new Date(participant.registeredAt).toDateString() : ''}`);
    doc.moveDown();
    doc.text("This document serves as proof of event registration.", { align: "center" });
    doc.end();

    stream.on("finish", () => {
      res.download(filePath, `${safeTitle}_registration.pdf`, (err) => {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        if (err) console.error("Error sending file:", err);
      });
    });
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ message: "Error generating registration PDF" });
  }
});

// Download calendar invite (.ics)
router.get("/:id/download-calendar", async (req, res) => {
  try {
    console.debug(`[events] download-calendar requested for id=${req.params.id}`);
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

  console.debug(`[events] event.date=${event.date} event.time=${event.time}`);
  // Parse event date and time properly
    let year, month, day, hour = 9, minute = 0;

    // Handle different date formats
    if (event.date) {
      let dateObj;
      if (event.date instanceof Date) {
        dateObj = event.date;
      } else {
        // Try to parse string date
        dateObj = new Date(event.date);
      }

      if (!isNaN(dateObj.getTime())) {
        year = dateObj.getFullYear();
        month = dateObj.getMonth() + 1; // getMonth() returns 0-11
        day = dateObj.getDate();
      }
    }

    // Parse time string (format: "HH:mm" or similar)
    if (event.time) {
      const timeMatch = String(event.time).match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        minute = parseInt(timeMatch[2], 10);
      }
    }

    // Validate parsed values
    if (!year || !month || !day) {
      console.error("Invalid date for event:", event.date);
      return res.status(500).json({ message: "Invalid event date" });
    }

    console.log(`Parsed event date: ${year}-${month}-${day} ${hour}:${minute}`);
    console.log('Using manual ICS generation for event:', event._id);
    console.log('Event data:', { title: event.title, date: event.date, time: event.time });

    // Generate actual ICS content for this event
    const eventStart = new Date(year, month - 1, day, hour, minute, 0);
    const eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    const formatDateTime = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      const y = d.getUTCFullYear();
      const m = pad(d.getUTCMonth() + 1);
      const dayd = pad(d.getUTCDate());
      const hh = pad(d.getUTCHours());
      const mm = pad(d.getUTCMinutes());
      const ss = pad(d.getUTCSeconds());
      return `${y}${m}${dayd}T${hh}${mm}${ss}Z`;
    };

    const uid = `event-${event._id}@ecotrack.local`;
    const dtstamp = formatDateTime(new Date());
    const dtstart = formatDateTime(eventStart);
    const dtend = formatDateTime(eventEnd);

    const escapeText = (text) => {
      return String(text || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const summary = escapeText(event.title || 'Event');
    const description = escapeText(`${event.details || ''}\n\nLocation: ${event.location || ''}\nPoints: ${event.points || ''}`);
    const location = escapeText(event.location || '');

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EcoTrack//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsContent = icsLines.join('\r\n');
    console.log('Generated ICS content length:', icsContent.length);

    res.setHeader('Content-Disposition', `attachment; filename="${escapeText(event.title||'event').replace(/[^a-z0-9\-_. ]/gi,'_')}.ics"`);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200);
    res.send(icsContent);
    return;
  } catch (err) {
    console.error("Error generating calendar:", err);
    res.status(500).json({ message: "Error generating calendar file" });
  }
});

export default router;