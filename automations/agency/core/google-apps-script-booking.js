/**
 * 3A Automation - Google Apps Script Booking System
 * @version 1.1.0
 * @date 2025-12-20
 *
 * Features:
 * - Real-time Google Calendar availability check
 * - Configurable business hours per day
 * - Blocked time slots (recurring + one-time)
 * - Buffer time between meetings
 * - WhatsApp-ready confirmation (via webhook)
 */

/**
 * CONFIG - 100% Flexible Business Hours
 *
 * Exemples de configurations:
 *
 * CONSULTANT (Lun-Ven 9h-18h):
 *   0: null, 1: {start:9, end:18}, ... 6: null
 *
 * RESTAURANT (Mar-Dim 11h-23h, fermé Lundi):
 *   0: {start:11, end:23}, 1: null, 2: {start:11, end:23}, ...
 *
 * MÉDECIN (Lun-Sam 8h-20h avec pause midi):
 *   Tous les jours {start:8, end:20} + BLOCKED_RECURRING pour pause 12h-14h
 *
 * BAR DE NUIT (20h-4h):
 *   {start:20, end:28}  // 28 = 4h du matin (24+4)
 */
var CONFIG = {
  // Identifiant calendrier (primary = calendrier principal du compte)
  CALENDAR_ID: "primary",

  // Fuseau horaire
  TIMEZONE: "Africa/Casablanca",

  // Durée d'un créneau en minutes
  SLOT_DURATION: 30,

  // Minutes de buffer entre RDV
  BUFFER_MINUTES: 0,

  // Préavis minimum en heures
  MIN_NOTICE_HOURS: 2,

  // Email de notification admin
  NOTIFICATION_EMAIL: "contact@3a-automation.com",

  /**
   * BUSINESS_HOURS - Heures d'ouverture par jour
   *
   * Format: { start: HH, end: HH }
   * - start/end en format 24h (0-23, ou >24 pour nuit suivante)
   * - null = fermé ce jour
   * - Supporte les horaires de nuit: {start:20, end:28} = 20h-4h
   *
   * Jours: 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
   */
  BUSINESS_HOURS: {
    0: null,                    // Dimanche
    1: { start: 9, end: 18 },   // Lundi
    2: { start: 9, end: 18 },   // Mardi
    3: { start: 9, end: 18 },   // Mercredi
    4: { start: 9, end: 18 },   // Jeudi
    5: { start: 9, end: 17 },   // Vendredi
    6: null                     // Samedi
  },

  /**
   * BLOCKED_RECURRING - Plages bloquées récurrentes (chaque semaine)
   *
   * Format: { day: 0-6, start: HH, end: HH }
   * Exemples:
   *   - Pause déjeuner: { day: 1, start: 12, end: 14 }
   *   - Réunion hebdo: { day: 3, start: 9, end: 10 }
   *
   * Pour désactiver: laisser le tableau vide []
   */
  BLOCKED_RECURRING: [
    // Exemple: pause déjeuner Lun-Ven
    // { day: 1, start: 12, end: 14 },
    // { day: 2, start: 12, end: 14 },
    // { day: 3, start: 12, end: 14 },
    // { day: 4, start: 12, end: 14 },
    // { day: 5, start: 12, end: 14 }
  ],

  /**
   * BLOCKED_DATES - Jours bloqués spécifiques
   *
   * Format: "YYYY-MM-DD"
   * Exemples: vacances, jours fériés, événements
   */
  BLOCKED_DATES: [
    // "2025-12-25", // Noël
    // "2025-01-01"  // Nouvel An
  ]
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.name || !data.email || !data.datetime) {
      return createResponse(false, "Missing required fields");
    }

    var startTime = new Date(data.datetime);
    var endTime = new Date(startTime.getTime() + CONFIG.SLOT_DURATION * 60000);

    if (!isSlotAvailable(startTime, endTime)) {
      return createResponse(false, "Slot not available");
    }

    var event = createCalendarEvent({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      service: data.service || "Consultation",
      notes: data.notes || "",
      startTime: startTime,
      endTime: endTime
    });

    sendConfirmationEmail(data, startTime);
    sendAdminNotification(data, startTime);

    return createResponse(true, "Booking confirmed", {
      eventId: event.getId(),
      datetime: startTime.toISOString(),
      name: data.name,
      email: data.email
    });

  } catch (error) {
    return createResponse(false, "Error: " + error.message);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action || "availability";

    if (action === "availability") {
      var slots = getAvailableSlots(14);
      return createResponse(true, "OK", { slots: slots, count: slots.length });
    }

    if (action === "health") {
      return createResponse(true, "OK", {
        service: "3A Booking",
        version: "1.0.1",
        timestamp: new Date().toISOString()
      });
    }

    return createResponse(false, "Unknown action");

  } catch (error) {
    return createResponse(false, "Error: " + error.message);
  }
}

/**
 * Helper: Check if a time falls within business hours (supports overnight)
 * @param {number} hour - Hour to check (0-23)
 * @param {Object} businessHours - {start: HH, end: HH} where end can be >24
 * @returns {boolean}
 *
 * Examples:
 * - {start: 11, end: 23} = 11:00 AM to 11:00 PM (same day)
 * - {start: 11, end: 25} = 11:00 AM to 1:00 AM next day (overnight)
 * - {start: 20, end: 28} = 8:00 PM to 4:00 AM next day (nightclub)
 */
function isWithinBusinessHours(hour, dayOfWeek, isNextDay) {
  var hours = CONFIG.BUSINESS_HOURS[dayOfWeek];
  if (!hours) return false;

  var checkHour = isNextDay ? hour + 24 : hour;

  // If end > 24, it means overnight operation
  if (hours.end > 24) {
    // For current day: start <= hour < 24
    // For next day (after midnight): 0 <= hour < (end - 24)
    if (isNextDay) {
      return hour < (hours.end - 24);
    } else {
      return hour >= hours.start;
    }
  } else {
    // Normal hours (same day)
    return !isNextDay && hour >= hours.start && hour < hours.end;
  }
}

function isSlotAvailable(startTime, endTime) {
  var calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
  var events = calendar.getEvents(startTime, endTime);

  var startHour = startTime.getHours();
  var dayOfWeek = startTime.getDay();
  var hours = CONFIG.BUSINESS_HOURS[dayOfWeek];

  // Check if this slot might be part of previous day's overnight hours
  var prevDayOfWeek = (dayOfWeek + 6) % 7; // Previous day
  var prevHours = CONFIG.BUSINESS_HOURS[prevDayOfWeek];

  var isValid = false;

  // Check current day's hours
  if (hours) {
    if (hours.end > 24) {
      // Overnight: valid if after opening
      isValid = startHour >= hours.start;
    } else {
      // Normal hours
      isValid = startHour >= hours.start && startHour < hours.end;
    }
  }

  // Check if this is continuation of previous day's overnight hours
  if (!isValid && prevHours && prevHours.end > 24) {
    var overnightEnd = prevHours.end - 24;
    if (startHour < overnightEnd) {
      isValid = true;
    }
  }

  if (!isValid) return false;

  // Check minimum notice
  var now = new Date();
  var minNotice = new Date(now.getTime() + CONFIG.MIN_NOTICE_HOURS * 60 * 60 * 1000);
  if (startTime < minNotice) {
    return false;
  }

  // Check blocked dates
  var dateStr = Utilities.formatDate(startTime, CONFIG.TIMEZONE, "yyyy-MM-dd");
  if (CONFIG.BLOCKED_DATES.indexOf(dateStr) !== -1) {
    return false;
  }

  // Check recurring blocked slots
  for (var i = 0; i < CONFIG.BLOCKED_RECURRING.length; i++) {
    var block = CONFIG.BLOCKED_RECURRING[i];
    if (block.day === dayOfWeek && startHour >= block.start && startHour < block.end) {
      return false;
    }
  }

  // Check calendar conflicts
  return events.length === 0;
}

/**
 * Get available slots supporting overnight hours
 *
 * For overnight businesses (end > 24):
 * - {start: 11, end: 25} = 11:00 AM to 1:00 AM next day
 * - {start: 20, end: 28} = 8:00 PM to 4:00 AM next day
 */
function getAvailableSlots(days) {
  var calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
  var slots = [];
  var now = new Date();
  var minNotice = new Date(now.getTime() + CONFIG.MIN_NOTICE_HOURS * 60 * 60 * 1000);

  for (var d = 1; d <= days; d++) {
    var date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(0, 0, 0, 0);

    // Check blocked dates
    var dateStr = Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy-MM-dd");
    if (CONFIG.BLOCKED_DATES.indexOf(dateStr) !== -1) {
      continue;
    }

    var dayOfWeek = date.getDay();
    var hours = CONFIG.BUSINESS_HOURS[dayOfWeek];

    if (!hours) continue;

    // Calculate actual end hour (handle overnight)
    var effectiveEndHour = hours.end;
    var extendsToNextDay = hours.end > 24;

    // For calendar events, we need to account for overnight
    var dayStart = new Date(date);
    dayStart.setHours(hours.start, 0, 0, 0);

    var dayEnd = new Date(date);
    if (extendsToNextDay) {
      // Set to next day at the overflow hour
      dayEnd.setDate(dayEnd.getDate() + 1);
      dayEnd.setHours(hours.end - 24, 0, 0, 0);
    } else {
      dayEnd.setHours(hours.end, 0, 0, 0);
    }

    var events = calendar.getEvents(dayStart, dayEnd);

    // Generate slots for the day
    for (var h = hours.start; h < effectiveEndHour; h++) {
      // Actual hour on clock (0-23)
      var actualHour = h >= 24 ? h - 24 : h;

      // Check recurring blocked slots
      var isBlockedHour = false;
      for (var b = 0; b < CONFIG.BLOCKED_RECURRING.length; b++) {
        var block = CONFIG.BLOCKED_RECURRING[b];
        if (block.day === dayOfWeek && h >= block.start && h < block.end) {
          isBlockedHour = true;
          break;
        }
      }
      if (isBlockedHour) continue;

      for (var m = 0; m < 60; m += CONFIG.SLOT_DURATION) {
        var slotStart = new Date(date);

        // If hour >= 24, this slot is on the next calendar day
        if (h >= 24) {
          slotStart.setDate(slotStart.getDate() + 1);
          slotStart.setHours(actualHour, m, 0, 0);
        } else {
          slotStart.setHours(h, m, 0, 0);
        }

        // Skip if before minimum notice time
        if (slotStart < minNotice) continue;

        var slotEnd = new Date(slotStart.getTime() + (CONFIG.SLOT_DURATION + CONFIG.BUFFER_MINUTES) * 60000);

        var isAvailable = true;
        for (var i = 0; i < events.length; i++) {
          var eventStart = events[i].getStartTime();
          var eventEnd = events[i].getEndTime();
          if (slotStart < eventEnd && slotEnd > eventStart) {
            isAvailable = false;
            break;
          }
        }

        if (isAvailable) {
          slots.push({
            date: Utilities.formatDate(slotStart, CONFIG.TIMEZONE, "yyyy-MM-dd"),
            time: Utilities.formatDate(slotStart, CONFIG.TIMEZONE, "HH:mm"),
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            dayName: Utilities.formatDate(slotStart, CONFIG.TIMEZONE, "EEEE"),
            overnight: h >= 24 // Flag if this is an overnight slot
          });
        }
      }
    }
  }

  return slots;
}

function createCalendarEvent(booking) {
  var calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();

  var title = "RDV: " + booking.name + " - " + booking.service;
  var description = "Client: " + booking.name + "\n" +
    "Email: " + booking.email + "\n" +
    "Phone: " + (booking.phone || "N/A") + "\n" +
    "Service: " + booking.service + "\n" +
    "Notes: " + (booking.notes || "None") + "\n\n" +
    "---\n3A Automation\nhttps://3a-automation.com";

  var event = calendar.createEvent(title, booking.startTime, booking.endTime, {
    description: description,
    guests: booking.email,
    sendInvites: true
  });

  event.addPopupReminder(30);
  event.addEmailReminder(1440);

  return event;
}

function sendConfirmationEmail(booking, datetime) {
  var dateStr = Utilities.formatDate(datetime, CONFIG.TIMEZONE, "EEEE d MMMM yyyy");
  var timeStr = Utilities.formatDate(datetime, CONFIG.TIMEZONE, "HH:mm");

  var subject = "Confirmation RDV - 3A Automation - " + dateStr;

  var body = "Bonjour " + booking.name + ",\n\n" +
    "Votre rendez-vous est confirme!\n\n" +
    "Date: " + dateStr + "\n" +
    "Heure: " + timeStr + " (30 minutes)\n" +
    "Service: " + (booking.service || "Consultation") + "\n\n" +
    "A bientot!\n\n" +
    "---\n3A Automation\nhttps://3a-automation.com";

  try {
    MailApp.sendEmail({
      to: booking.email,
      subject: subject,
      body: body,
      name: "3A Automation"
    });
  } catch (err) {
    Logger.log("Email error: " + err);
  }
}

function sendAdminNotification(booking, datetime) {
  var dateStr = Utilities.formatDate(datetime, CONFIG.TIMEZONE, "EEEE d MMMM yyyy HH:mm");

  var subject = "[3A] Nouveau RDV: " + booking.name;

  var body = "Nouveau rendez-vous!\n\n" +
    "Client: " + booking.name + "\n" +
    "Email: " + booking.email + "\n" +
    "Phone: " + (booking.phone || "N/A") + "\n" +
    "Service: " + (booking.service || "Consultation") + "\n" +
    "Date: " + dateStr + "\n" +
    "Notes: " + (booking.notes || "None");

  try {
    MailApp.sendEmail({
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: subject,
      body: body
    });
  } catch (err) {
    Logger.log("Admin notification error: " + err);
  }
}

function createResponse(success, message, data) {
  var response = {
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

function testSetup() {
  var calendar = CalendarApp.getDefaultCalendar();
  Logger.log("Calendar: " + calendar.getName());
  Logger.log("ID: " + calendar.getId());
  var slots = getAvailableSlots(7);
  Logger.log("Slots (7 days): " + slots.length);
  var quota = MailApp.getRemainingDailyQuota();
  Logger.log("Email quota: " + quota);
  Logger.log("Test complete!");
}

/**
 * ========================================
 * TEMPLATES DE CONFIGURATION PAR SECTEUR
 * ========================================
 *
 * Copiez-collez la config de votre secteur dans CONFIG.BUSINESS_HOURS
 */

var CONFIG_TEMPLATES = {
  // CONSULTANT / AGENCE (Lun-Ven 9h-18h)
  consultant: {
    BUSINESS_HOURS: {
      0: null,
      1: { start: 9, end: 18 },
      2: { start: 9, end: 18 },
      3: { start: 9, end: 18 },
      4: { start: 9, end: 18 },
      5: { start: 9, end: 17 },
      6: null
    },
    BLOCKED_RECURRING: [
      { day: 1, start: 12, end: 14 },
      { day: 2, start: 12, end: 14 },
      { day: 3, start: 12, end: 14 },
      { day: 4, start: 12, end: 14 },
      { day: 5, start: 12, end: 14 }
    ]
  },

  // RESTAURANT (Mar-Dim 11h-23h, fermé Lundi)
  restaurant: {
    BUSINESS_HOURS: {
      0: { start: 11, end: 23 },  // Dimanche
      1: null,                     // Lundi fermé
      2: { start: 11, end: 23 },  // Mardi
      3: { start: 11, end: 23 },  // Mercredi
      4: { start: 11, end: 23 },  // Jeudi
      5: { start: 11, end: 24 },  // Vendredi (minuit)
      6: { start: 11, end: 24 }   // Samedi (minuit)
    },
    BLOCKED_RECURRING: [
      { day: 2, start: 15, end: 18 },  // Pause mardi
      { day: 3, start: 15, end: 18 },  // Pause mercredi
      { day: 4, start: 15, end: 18 },  // Pause jeudi
      { day: 5, start: 15, end: 18 },  // Pause vendredi
      { day: 6, start: 15, end: 18 },  // Pause samedi
      { day: 0, start: 15, end: 18 }   // Pause dimanche
    ]
  },

  // MÉDECIN / CABINET (Lun-Sam 8h-20h avec pause)
  medical: {
    BUSINESS_HOURS: {
      0: null,
      1: { start: 8, end: 20 },
      2: { start: 8, end: 20 },
      3: { start: 8, end: 20 },
      4: { start: 8, end: 20 },
      5: { start: 8, end: 20 },
      6: { start: 9, end: 13 }   // Samedi matin
    },
    BLOCKED_RECURRING: [
      { day: 1, start: 12, end: 14 },
      { day: 2, start: 12, end: 14 },
      { day: 3, start: 12, end: 14 },
      { day: 4, start: 12, end: 14 },
      { day: 5, start: 12, end: 14 }
    ]
  },

  // ARCHITECTE / BUREAU (Lun-Ven 9h-19h)
  architect: {
    BUSINESS_HOURS: {
      0: null,
      1: { start: 9, end: 19 },
      2: { start: 9, end: 19 },
      3: { start: 9, end: 19 },
      4: { start: 9, end: 19 },
      5: { start: 9, end: 18 },
      6: null
    },
    BLOCKED_RECURRING: []  // Pas de pause bloquée
  },

  // E-COMMERCE 24/7 (tous les jours, toutes les heures)
  ecommerce247: {
    BUSINESS_HOURS: {
      0: { start: 0, end: 24 },
      1: { start: 0, end: 24 },
      2: { start: 0, end: 24 },
      3: { start: 0, end: 24 },
      4: { start: 0, end: 24 },
      5: { start: 0, end: 24 },
      6: { start: 0, end: 24 }
    },
    BLOCKED_RECURRING: []
  },

  // BAR / CLUB (20h-4h, Jeu-Sam)
  nightclub: {
    BUSINESS_HOURS: {
      0: null,
      1: null,
      2: null,
      3: null,
      4: { start: 20, end: 28 },  // Jeudi 20h - Vendredi 4h
      5: { start: 20, end: 28 },  // Vendredi 20h - Samedi 4h
      6: { start: 20, end: 28 }   // Samedi 20h - Dimanche 4h
    },
    BLOCKED_RECURRING: []
  },

  // RESTAURANT AVEC ALCOOL (11h-1h30, fermé Lundi)
  // end: 25.5 = 1:30 AM next day
  restaurantBar: {
    BUSINESS_HOURS: {
      0: { start: 11, end: 25 },  // Dimanche 11h - Lundi 1h
      1: null,                     // Lundi fermé
      2: { start: 11, end: 25 },  // Mardi 11h - Mercredi 1h
      3: { start: 11, end: 25 },  // Mercredi 11h - Jeudi 1h
      4: { start: 11, end: 26 },  // Jeudi 11h - Vendredi 2h
      5: { start: 11, end: 26 },  // Vendredi 11h - Samedi 2h
      6: { start: 11, end: 26 }   // Samedi 11h - Dimanche 2h
    },
    BLOCKED_RECURRING: [
      { day: 2, start: 15, end: 18 },
      { day: 3, start: 15, end: 18 },
      { day: 4, start: 15, end: 18 },
      { day: 5, start: 15, end: 18 },
      { day: 6, start: 15, end: 18 },
      { day: 0, start: 15, end: 18 }
    ]
  },

  // FAST FOOD / KEBAB (10h-2h, tous les jours)
  fastFood: {
    BUSINESS_HOURS: {
      0: { start: 10, end: 26 },  // 10h - 2h
      1: { start: 10, end: 26 },
      2: { start: 10, end: 26 },
      3: { start: 10, end: 26 },
      4: { start: 10, end: 27 },  // Jeudi prolongé jusqu'à 3h
      5: { start: 10, end: 27 },  // Vendredi prolongé jusqu'à 3h
      6: { start: 10, end: 27 }   // Samedi prolongé jusqu'à 3h
    },
    BLOCKED_RECURRING: []  // Pas de pause (service continu)
  },

  // BOULANGERIE (6h-20h, fermé Lundi)
  bakery: {
    BUSINESS_HOURS: {
      0: { start: 7, end: 19 },   // Dimanche matin
      1: null,                     // Lundi fermé
      2: { start: 6, end: 20 },
      3: { start: 6, end: 20 },
      4: { start: 6, end: 20 },
      5: { start: 6, end: 20 },
      6: { start: 6, end: 20 }
    },
    BLOCKED_RECURRING: [
      { day: 2, start: 13, end: 15 },  // Pause l'après-midi
      { day: 3, start: 13, end: 15 },
      { day: 4, start: 13, end: 15 },
      { day: 5, start: 13, end: 15 },
      { day: 6, start: 13, end: 15 }
    ]
  }
};

// Fonction pour appliquer un template
function applyTemplate(templateName) {
  var template = CONFIG_TEMPLATES[templateName];
  if (!template) {
    Logger.log("Template not found: " + templateName);
    return false;
  }
  CONFIG.BUSINESS_HOURS = template.BUSINESS_HOURS;
  CONFIG.BLOCKED_RECURRING = template.BLOCKED_RECURRING;
  Logger.log("Applied template: " + templateName);
  return true;
}
