/**
 * 3A Automation - Google Apps Script Booking System
 *
 * INSTALLATION:
 * 1. Go to https://script.google.com
 * 2. Create new project "3A Booking System"
 * 3. Paste this entire code
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. Update WEBAPP_URL in booking.html
 *
 * @version 1.0.0
 * @date 2025-12-20
 */

// Configuration
const CONFIG = {
  CALENDAR_ID: 'primary', // or specific calendar ID
  TIMEZONE: 'Africa/Casablanca',
  SLOT_DURATION: 30, // minutes
  NOTIFICATION_EMAIL: 'contact@3a-automation.com',

  // Business hours (24h format)
  BUSINESS_HOURS: {
    1: { start: 9, end: 18 }, // Monday
    2: { start: 9, end: 18 }, // Tuesday
    3: { start: 9, end: 18 }, // Wednesday
    4: { start: 9, end: 18 }, // Thursday
    5: { start: 9, end: 18 }, // Friday
    6: null, // Saturday - closed
    0: null  // Sunday - closed
  }
};

/**
 * Handle POST requests (booking creation)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validate required fields
    if (!data.name || !data.email || !data.datetime) {
      return createResponse(false, 'Missing required fields: name, email, datetime');
    }

    // Parse datetime
    const startTime = new Date(data.datetime);
    const endTime = new Date(startTime.getTime() + CONFIG.SLOT_DURATION * 60000);

    // Check if slot is available
    if (!isSlotAvailable(startTime, endTime)) {
      return createResponse(false, 'Ce créneau n\'est plus disponible. Veuillez en choisir un autre.');
    }

    // Create calendar event
    const event = createCalendarEvent({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      service: data.service || 'Consultation',
      notes: data.notes || '',
      startTime: startTime,
      endTime: endTime
    });

    // Send confirmation email
    sendConfirmationEmail(data, startTime);

    // Send notification to admin
    sendAdminNotification(data, startTime);

    return createResponse(true, 'Rendez-vous confirmé!', {
      eventId: event.getId(),
      datetime: startTime.toISOString(),
      name: data.name,
      email: data.email
    });

  } catch (error) {
    console.error('Booking error:', error);
    return createResponse(false, 'Erreur: ' + error.message);
  }
}

/**
 * Handle GET requests (availability check)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'availability';

    if (action === 'availability') {
      const slots = getAvailableSlots(14); // Next 14 days
      return createResponse(true, 'OK', { slots: slots, count: slots.length });
    }

    if (action === 'health') {
      return createResponse(true, 'Booking system operational', {
        service: '3A Automation Booking',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    return createResponse(false, 'Unknown action');

  } catch (error) {
    console.error('GET error:', error);
    return createResponse(false, 'Erreur: ' + error.message);
  }
}

/**
 * Check if a time slot is available
 */
function isSlotAvailable(startTime, endTime) {
  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const events = calendar.getEvents(startTime, endTime);

  // Check business hours
  const dayOfWeek = startTime.getDay();
  const hours = CONFIG.BUSINESS_HOURS[dayOfWeek];

  if (!hours) return false; // Closed day

  const startHour = startTime.getHours();
  const endHour = endTime.getHours();

  if (startHour < hours.start || endHour > hours.end) {
    return false; // Outside business hours
  }

  return events.length === 0;
}

/**
 * Get available slots for the next N days
 */
function getAvailableSlots(days) {
  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const slots = [];
  const now = new Date();

  for (let d = 1; d <= days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    const hours = CONFIG.BUSINESS_HOURS[dayOfWeek];

    if (!hours) continue; // Skip closed days

    // Get all events for this day
    const dayStart = new Date(date);
    dayStart.setHours(hours.start, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(hours.end, 0, 0, 0);

    const events = calendar.getEvents(dayStart, dayEnd);

    // Generate slots
    for (let h = hours.start; h < hours.end; h++) {
      for (let m = 0; m < 60; m += CONFIG.SLOT_DURATION) {
        const slotStart = new Date(date);
        slotStart.setHours(h, m, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + CONFIG.SLOT_DURATION * 60000);

        // Check if slot overlaps with any event
        const isAvailable = !events.some(event => {
          const eventStart = event.getStartTime();
          const eventEnd = event.getEndTime();
          return slotStart < eventEnd && slotEnd > eventStart;
        });

        if (isAvailable && slotEnd.getHours() <= hours.end) {
          slots.push({
            date: Utilities.formatDate(slotStart, CONFIG.TIMEZONE, 'yyyy-MM-dd'),
            time: Utilities.formatDate(slotStart, CONFIG.TIMEZONE, 'HH:mm'),
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            dayName: Utilities.formatDate(slotStart, CONFIG.TIMEZONE, 'EEEE')
          });
        }
      }
    }
  }

  return slots;
}

/**
 * Create a calendar event
 */
function createCalendarEvent(booking) {
  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();

  const title = `RDV: ${booking.name} - ${booking.service}`;
  const description = `
Client: ${booking.name}
Email: ${booking.email}
Téléphone: ${booking.phone || 'Non fourni'}
Service: ${booking.service}
Notes: ${booking.notes || 'Aucune'}

---
Réservation automatique via 3A Automation
https://3a-automation.com
  `.trim();

  const event = calendar.createEvent(title, booking.startTime, booking.endTime, {
    description: description,
    guests: booking.email,
    sendInvites: true
  });

  // Set reminder
  event.addPopupReminder(30); // 30 minutes before
  event.addEmailReminder(24 * 60); // 24 hours before

  return event;
}

/**
 * Send confirmation email to client
 */
function sendConfirmationEmail(booking, datetime) {
  const dateStr = Utilities.formatDate(datetime, CONFIG.TIMEZONE, 'EEEE d MMMM yyyy');
  const timeStr = Utilities.formatDate(datetime, CONFIG.TIMEZONE, 'HH:mm');

  const subject = `Confirmation RDV - 3A Automation - ${dateStr}`;

  const body = `
Bonjour ${booking.name},

Votre rendez-vous est confirmé!

📅 Date: ${dateStr}
🕐 Heure: ${timeStr} (30 minutes)
📋 Service: ${booking.service || 'Consultation'}

Vous recevrez également une invitation Google Calendar.

À très bientôt!

---
3A Automation
Automation · Analytics · AI
https://3a-automation.com
contact@3a-automation.com
  `.trim();

  try {
    MailApp.sendEmail({
      to: booking.email,
      subject: subject,
      body: body,
      name: '3A Automation'
    });
  } catch (e) {
    console.error('Email error:', e);
  }
}

/**
 * Send notification to admin
 */
function sendAdminNotification(booking, datetime) {
  const dateStr = Utilities.formatDate(datetime, CONFIG.TIMEZONE, 'EEEE d MMMM yyyy à HH:mm');

  const subject = `[3A] Nouveau RDV: ${booking.name}`;

  const body = `
Nouveau rendez-vous réservé!

Client: ${booking.name}
Email: ${booking.email}
Téléphone: ${booking.phone || 'Non fourni'}
Service: ${booking.service || 'Consultation'}
Date: ${dateStr}
Notes: ${booking.notes || 'Aucune'}
  `.trim();

  try {
    MailApp.sendEmail({
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: subject,
      body: body
    });
  } catch (e) {
    console.error('Admin notification error:', e);
  }
}

/**
 * Create JSON response with CORS headers
 */
function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };

  if (data) {
    response.data = data;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run manually to verify setup
 */
function testSetup() {
  console.log('Testing booking system setup...');

  // Test calendar access
  const calendar = CalendarApp.getDefaultCalendar();
  console.log('Calendar name:', calendar.getName());
  console.log('Calendar ID:', calendar.getId());

  // Test availability
  const slots = getAvailableSlots(7);
  console.log('Available slots (next 7 days):', slots.length);

  // Test email quota
  const quota = MailApp.getRemainingDailyQuota();
  console.log('Email quota remaining:', quota);

  console.log('Setup test complete!');
}
