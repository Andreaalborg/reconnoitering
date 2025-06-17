// src/services/calendarExport.ts

/**
 * Service for generating calendar files in iCalendar (.ics) format
 * Compatible with Outlook, Google Calendar, Apple Calendar, etc.
 */

interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    url?: string;
  }
  
  /**
   * Generates an iCalendar (.ics) file content for a single event
   */
  export function generateICalEvent(event: CalendarEvent): string {
    // Format dates according to iCalendar spec (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    };
  
    // Escape special characters in text fields
    const escapeText = (text: string): string => {
      return text.replace(/[\\;,]/g, (match) => '\\' + match);
    };
  
    // Format description with URL if provided
    let description = escapeText(event.description);
    if (event.url) {
      description += `\\n\\nMore Info: ${event.url}`;
    }
  
    // Build iCalendar content
    const now = formatDate(new Date());
    const uid = `${now}-${Math.floor(Math.random() * 1000000)}@reconnoitering.com`;
  
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Reconnoitering//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${escapeText(event.location)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }
  
  /**
   * Generates an iCalendar (.ics) file for multiple events
   */
  export function generateICalEvents(events: CalendarEvent[]): string {
    // Format dates according to iCalendar spec
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    };
  
    // Escape special characters in text fields
    const escapeText = (text: string): string => {
      return text.replace(/[\\;,]/g, (match) => '\\' + match);
    };
  
    // Start calendar file
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Reconnoitering//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n');
  
    // Add each event
    const now = formatDate(new Date());
  
    events.forEach((event, index) => {
      // Format description with URL if provided
      let description = escapeText(event.description);
      if (event.url) {
        description += `\\n\\nMore Info: ${event.url}`;
      }
  
      const uid = `${now}-${index}-${Math.floor(Math.random() * 1000000)}@reconnoitering.com`;
  
      const eventContent = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${formatDate(event.startDate)}`,
        `DTEND:${formatDate(event.endDate)}`,
        `SUMMARY:${escapeText(event.title)}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${escapeText(event.location)}`,
        'END:VEVENT'
      ].join('\r\n');
  
      icalContent += '\r\n' + eventContent;
    });
  
    // End calendar file
    icalContent += '\r\nEND:VCALENDAR';
  
    return icalContent;
  }
  
  /**
   * Generates an export url that triggers a download
   */
  export function generateCalendarDownloadUrl(icalContent: string): string {
    // Convert to Base64 (for data URL)
    const base64Content = btoa(unescape(encodeURIComponent(icalContent)));
    // Create a data URL
    return `data:text/calendar;charset=utf-8;base64,${base64Content}`;
  }
  
  /**
   * Create a calendar file for a single exhibition
   */
  export function exportExhibitionToCalendar(exhibition: any): void {
    // Create start and end dates (use 10am-6pm if only day is specified)
    const startDate = new Date(exhibition.startDate);
    startDate.setHours(10, 0, 0, 0);
    
    const endDate = new Date(exhibition.endDate);
    endDate.setHours(18, 0, 0, 0);
  
    // Format location with null checks
    let location = 'Location not specified';
    if (exhibition.location) {
      const locationParts = [
        exhibition.location.name,
        exhibition.location.address,
        exhibition.location.city,
        exhibition.location.country
      ].filter(part => part && part.trim()); // Remove empty/null parts
      
      location = locationParts.join(', ');
    }
  
    // Create event object
    const event: CalendarEvent = {
      title: exhibition.title || 'Exhibition',
      description: exhibition.description || '',
      location,
      startDate,
      endDate,
      url: exhibition.websiteUrl || exhibition.ticketUrl
    };
  
    // Generate calendar file
    const icalContent = generateICalEvent(event);
    
    // Create filename
    const filename = `exhibition_${(exhibition.title || 'exhibition').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    
    // Trigger download
    const downloadUrl = generateCalendarDownloadUrl(icalContent);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Create a calendar file for a day planner itinerary
   */
  export function exportItineraryToCalendar(date: Date, items: any[]): void {
    // Filter for exhibition items only
    const events: CalendarEvent[] = items
      .filter(item => item.type === 'exhibition' && item.exhibition)
      .map(item => {
        const exhibition = item.exhibition;
        
        // Parse start and end times
        const [startHour, startMinute] = item.startTime.split(':').map(Number);
        const [endHour, endMinute] = item.endTime.split(':').map(Number);
        
        // Create start and end date objects
        const startDate = new Date(date);
        startDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(endHour, endMinute, 0, 0);
        
        // Format location
        let location = 'Location not specified';
        if (exhibition.location) {
          const locationParts = [
            exhibition.location.name,
            exhibition.location.address,
            exhibition.location.city,
            exhibition.location.country
          ].filter(part => part && part.trim()); // Remove empty/null parts
          
          location = locationParts.join(', ');
        }
        
        // Create event description
        let description = exhibition.description || '';
        if (item.note) {
          description = `${item.note}\n\n${description}`;
        }
        
        return {
          title: exhibition.title || 'Exhibition',
          description,
          location,
          startDate,
          endDate,
          url: exhibition.websiteUrl || exhibition.ticketUrl
        };
      });
    
    // If there are no exhibition events, return
    if (events.length === 0) return;
    
    // Generate calendar content
    const icalContent = generateICalEvents(events);
    
    // Format date for filename
    const dateString = date.toISOString().split('T')[0];
    
    // Create filename
    const filename = `reconnoitering_itinerary_${dateString}.ics`;
    
    // Trigger download
    const downloadUrl = generateCalendarDownloadUrl(icalContent);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Share calendar as email attachment
   */
  export function shareCalendarByEmail(icalContent: string, title: string): void {
    // Create a mailto link with subject and body
    const subject = encodeURIComponent(`Exhibition Itinerary: ${title}`);
    const body = encodeURIComponent(`I'd like to share this exhibition itinerary with you.\n\nPlease find the calendar file attached.\n\nRegards,`);
    
    // Create mailto URL (note: this doesn't actually attach files, as browsers can't do that)
    // Instead, we'll tell users to download the file and attach it manually
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    
    // Open email client
    window.open(mailtoUrl);
    
    // Alert user to download and attach the file manually
    alert('Please download the calendar file first and attach it to your email manually.');
  }