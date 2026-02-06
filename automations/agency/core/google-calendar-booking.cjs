#!/usr/bin/env node
/**
 * Google Calendar Booking System
 * Implements appointment scheduling with Google Calendar integration
 * Native Node.js implementation
 *
 * @version 1.0.0
 * @date 2025-12-20
 */

require('dotenv').config();

const { google } = require('googleapis');

// Security utilities
const {
  validateInput,
  validateRequestBody,
  sanitizeInput,
  RateLimiter,
  requestSizeLimiter,
  setSecurityHeaders,
  corsMiddleware,
} = require('../../lib/security-utils.cjs');

// Configuration
const CONFIG = {
  // Google Calendar OAuth2 credentials
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback',

  // Calendar settings
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',

  // Business hours (Morocco time - UTC+1)
  businessHours: {
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '18:00' },
    friday: { start: '09:00', end: '18:00' },
    saturday: null, // Closed
    sunday: null    // Closed
  },

  // Default meeting duration (minutes)
  defaultDuration: 30,

  // Buffer between meetings (minutes)
  bufferTime: 15,

  // Timezone
  timezone: 'Africa/Casablanca'
};

// Initialize OAuth2 client
function getOAuth2Client() {
  return new google.auth.OAuth2(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.redirectUri
  );
}

/**
 * Get available time slots for a specific date
 * @param {Date} date - The date to check
 * @param {object} auth - Authenticated OAuth2 client
 * @returns {Promise<Array>} - Available time slots
 */
async function getAvailableSlots(date, auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const businessDay = CONFIG.businessHours[dayName];

  if (!businessDay) {
    return []; // Closed day
  }

  const startOfDay = new Date(date);
  const [startHour, startMin] = businessDay.start.split(':');
  startOfDay.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

  const endOfDay = new Date(date);
  const [endHour, endMin] = businessDay.end.split(':');
  endOfDay.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

  // Get existing events
  const response = await calendar.events.list({
    calendarId: CONFIG.calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  const busyTimes = response.data.items.map(event => ({
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date)
  }));

  // Generate available slots
  const slots = [];
  let currentTime = new Date(startOfDay);

  while (currentTime < endOfDay) {
    const slotEnd = new Date(currentTime.getTime() + CONFIG.defaultDuration * 60000);

    // Check if slot overlaps with any busy time
    const isAvailable = !busyTimes.some(busy => {
      const bufferStart = new Date(busy.start.getTime() - CONFIG.bufferTime * 60000);
      const bufferEnd = new Date(busy.end.getTime() + CONFIG.bufferTime * 60000);
      return currentTime < bufferEnd && slotEnd > bufferStart;
    });

    if (isAvailable && slotEnd <= endOfDay) {
      slots.push({
        start: new Date(currentTime),
        end: slotEnd,
        formatted: currentTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: CONFIG.timezone
        })
      });
    }

    // Move to next slot
    currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30 min intervals
  }

  return slots;
}

/**
 * Create a booking event in Google Calendar
 * @param {object} booking - Booking details
 * @param {object} auth - Authenticated OAuth2 client
 * @returns {Promise<object>} - Created event
 */
async function createBooking(booking, auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: `RDV: ${booking.name} - ${booking.service || 'Consultation'}`,
    description: `
Client: ${booking.name}
Email: ${booking.email}
Téléphone: ${booking.phone || 'Non fourni'}
Service: ${booking.service || 'Consultation initiale'}
Notes: ${booking.notes || 'Aucune'}

---
Créé automatiquement via 3A Automation Booking System
    `.trim(),
    start: {
      dateTime: booking.startTime,
      timeZone: CONFIG.timezone
    },
    end: {
      dateTime: booking.endTime || new Date(new Date(booking.startTime).getTime() + CONFIG.defaultDuration * 60000).toISOString(),
      timeZone: CONFIG.timezone
    },
    attendees: booking.email ? [{ email: booking.email }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 30 }        // 30 minutes before
      ]
    },
    colorId: '9' // Blue color for client meetings
  };

  const response = await calendar.events.insert({
    calendarId: CONFIG.calendarId,
    resource: event,
    sendUpdates: 'all' // Send email notifications
  });

  return response.data;
}

/**
 * Cancel a booking
 * @param {string} eventId - Google Calendar event ID
 * @param {object} auth - Authenticated OAuth2 client
 */
async function cancelBooking(eventId, auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId: CONFIG.calendarId,
    eventId: eventId,
    sendUpdates: 'all'
  });

  return { success: true, message: 'Booking cancelled' };
}

/**
 * Get available dates for the next N days
 * @param {number} days - Number of days to check
 * @param {object} auth - Authenticated OAuth2 client
 */
async function getAvailableDates(days = 14, auth) {
  const availableDates = [];
  const today = new Date();

  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });

    if (CONFIG.businessHours[dayName]) {
      const slots = await getAvailableSlots(date, auth);
      if (slots.length > 0) {
        availableDates.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
          slotsCount: slots.length,
          firstSlot: slots[0].formatted,
          lastSlot: slots[slots.length - 1].formatted
        });
      }
    }
  }

  return availableDates;
}

// Rate limiter instance (30 requests per minute per IP)
const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 30 });

// Booking request validation schema
const BOOKING_SCHEMA = {
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email: { required: true, type: 'email' },
  phone: { required: false, type: 'phone' },
  service: { required: false, type: 'string', maxLength: 200 },
  startTime: { required: true, type: 'datetime' },
  notes: { required: false, type: 'string', maxLength: 1000 }
};

// Express server for webhook endpoints
async function startServer() {
  const express = require('express');
  const app = express();

  // Security middleware (order matters)
  app.use(requestSizeLimiter(100 * 1024)); // 100KB max request size
  app.use(express.json({ limit: '100kb' }));
  app.use((req, res, next) => {
    setSecurityHeaders(res);
    next();
  });
  app.use(corsMiddleware(['https://3a-automation.com', 'https://dashboard.3a-automation.com']));

  // Rate limiting middleware
  app.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!rateLimiter.isAllowed(clientIp)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: '3A Booking System' });
  });

  // Get available dates
  app.get('/api/booking/dates', async (req, res) => {
    try {
      // Note: In production, use proper OAuth flow
      res.json({
        error: 'OAuth not configured',
        message: 'Please complete Google Calendar OAuth setup'
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get available slots for a date
  app.get('/api/booking/slots/:date', async (req, res) => {
    try {
      const { date } = req.params;

      // Validate date format (YYYY-MM-DD)
      if (!validateInput(date, 'date')) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      }

      // Sanitize the date parameter
      const sanitizedDate = sanitizeInput(date);

      res.json({
        date: sanitizedDate,
        error: 'OAuth not configured',
        message: 'Please complete Google Calendar OAuth setup'
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create booking
  app.post('/api/booking/create', async (req, res) => {
    try {
      // Validate request body against schema
      const validation = validateRequestBody(req.body, BOOKING_SCHEMA);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Sanitize all string inputs
      const sanitizedData = {
        name: sanitizeInput(req.body.name),
        email: sanitizeInput(req.body.email),
        phone: req.body.phone ? sanitizeInput(req.body.phone) : null,
        service: req.body.service ? sanitizeInput(req.body.service) : null,
        startTime: req.body.startTime,
        notes: req.body.notes ? sanitizeInput(req.body.notes) : null
      };

      res.json({
        error: 'OAuth not configured',
        message: 'Please complete Google Calendar OAuth setup',
        receivedData: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          service: sanitizedData.service,
          startTime: sanitizedData.startTime
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const PORT = process.env.BOOKING_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`📅 3A Booking System running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API: http://localhost:${PORT}/api/booking/`);
    console.log(`   Security: Rate limiting, input validation, security headers enabled`);
  });
}

// CLI mode
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--server')) {
    await startServer();
    return;
  }

  console.log('📅 3A Automation - Google Calendar Booking System');
  console.log('================================================\n');

  // Validate configuration
  const missing = [];
  if (!CONFIG.clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!CONFIG.clientSecret) missing.push('GOOGLE_CLIENT_SECRET');

  if (missing.length > 0) {
    console.log('⚠️  Configuration requise:');
    missing.forEach(m => console.log(`   - ${m}`));
    console.log('\nÉtapes de configuration:');
    console.log('1. Créer un projet Google Cloud Console');
    console.log('2. Activer Google Calendar API');
    console.log('3. Créer des credentials OAuth2');
    console.log('4. Ajouter les variables dans .env\n');
    console.log('Consultez la documentation Google Calendar API pour la configuration.');
    return;
  }

  console.log('✅ Configuration OK');
  console.log('Business Hours:');
  Object.entries(CONFIG.businessHours).forEach(([day, hours]) => {
    if (hours) {
      console.log(`   ${day}: ${hours.start} - ${hours.end}`);
    } else {
      console.log(`   ${day}: Fermé`);
    }
  });

  console.log('\nUtilisation:');
  console.log('  node google-calendar-booking.cjs --server  # Start webhook server');
}

// Export for use as module
module.exports = {
  getAvailableSlots,
  getAvailableDates,
  createBooking,
  cancelBooking,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
