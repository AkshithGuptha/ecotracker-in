import express from 'express';
import ContactMessage from '../models/ContactMessage.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      });
    }

    // Create contact message
    const contactMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
      type: type || 'general'
    });

    await contactMessage.save();

    // Send email or SMS based on type
    if (type === 'email') {
      // Configure nodemailer transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: email,
        to: 'vimalanvitha2006@gmail.com',
        subject: `Contact Form: ${subject}`,
        html: `
          <h3>New Contact Message</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to vimalanvitha2006@gmail.com');
    } else if (type === 'phone') {
      // For SMS, we'll store the message and could integrate with SMS service
      // For now, just save to database - you might want to integrate with Twilio or similar
      console.log(`SMS to 9182075981: Name: ${name}, Email: ${email}, Subject: ${subject}, Message: ${message}`);

      // You can integrate with SMS service here later
      // Example with Twilio:
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: `New message from ${name} (${email}): ${message}`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: '+9182075981'
      // });
    }

    res.status(201).json({
      message: 'Thank you for your message! We will get back to you soon.',
      success: true
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      message: 'Failed to send message. Please try again later.',
      success: false
    });
  }
});

// Get all contact messages (admin only)
router.get('/all', async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      message: 'Failed to fetch messages',
      success: false
    });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
        success: false
      });
    }

    res.json({
      message: 'Message marked as read',
      success: true,
      message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      message: 'Failed to update message status',
      success: false
    });
  }
});

// Respond to message
router.put('/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        message: 'Response is required',
        success: false
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      {
        status: 'responded',
        respondedAt: new Date(),
        response
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
        success: false
      });
    }

    // Here you could also send an email to the user
    // await sendEmail(message.email, 'Re: ' + message.subject, response);

    res.json({
      message: 'Response sent successfully',
      success: true,
      message
    });
  } catch (error) {
    console.error('Error responding to message:', error);
    res.status(500).json({
      message: 'Failed to send response',
      success: false
    });
  }
});

export default router;
