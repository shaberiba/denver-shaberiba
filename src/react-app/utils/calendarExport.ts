import { FacebookEventData } from "../../worker/facebookEvent";
import { getEventAddress } from "../hooks/useFacebookEvents";

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // fallback when Facebook doesn't provide an end time

const facebookEventUrl = (id: string): string => `https://www.facebook.com/events/${id}/`;

const getEventTimes = (event: FacebookEventData): { start: Date; end: Date } => {
  const start = new Date(event.start_time);
  const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return { start, end };
};

// Formats a Date as a UTC timestamp in the compact form calendar URLs/ICS expect: YYYYMMDDTHHMMSSZ
const toUTCTimestamp = (date: Date): string => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const buildDescription = (event: FacebookEventData): string => {
  const parts = [event.description, `More info: ${facebookEventUrl(event.id)}`].filter(Boolean);
  return parts.join('\n\n');
};

export const getGoogleCalendarUrl = (event: FacebookEventData): string => {
  const { start, end } = getEventTimes(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toUTCTimestamp(start)}/${toUTCTimestamp(end)}`,
    details: buildDescription(event),
    location: getEventAddress(event.place),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const getOutlookCalendarUrl = (event: FacebookEventData): string => {
  const { start, end } = getEventTimes(event);
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.name,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: buildDescription(event),
    location: getEventAddress(event.place),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

const escapeICSText = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

// RFC 5545 requires lines to be folded at 75 octets, with continuations starting with a space
const foldICSLine = (line: string): string => {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push(line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n ');
};

export const buildICSContent = (event: FacebookEventData): string => {
  const { start, end } = getEventTimes(event);
  const location = getEventAddress(event.place);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Denver Shaberiba//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@denver-shaberiba`,
    `DTSTAMP:${toUTCTimestamp(new Date())}`,
    `DTSTART:${toUTCTimestamp(start)}`,
    `DTEND:${toUTCTimestamp(end)}`,
    `SUMMARY:${escapeICSText(event.name)}`,
    `DESCRIPTION:${escapeICSText(buildDescription(event))}`,
    location ? `LOCATION:${escapeICSText(location)}` : undefined,
    `URL:${facebookEventUrl(event.id)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => Boolean(line));

  return lines.map(foldICSLine).join('\r\n');
};

// URL of the server-generated feed containing every upcoming event, for bulk import/subscription
export const getEventsFeedUrl = (): string => `${window.location.origin}/api/events/calendar.ics`;

// webcal:// is the scheme calendar apps (Apple Calendar, and most others) recognize to subscribe to a live feed
export const getWebcalFeedUrl = (): string => getEventsFeedUrl().replace(/^https?:/, 'webcal:');

export const getGoogleCalendarSubscribeUrl = (): string => {
  const params = new URLSearchParams({ cid: getWebcalFeedUrl() });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const getOutlookCalendarSubscribeUrl = (): string => {
  const params = new URLSearchParams({
    url: getEventsFeedUrl(),
    name: 'Denver Shaberiba Events',
  });
  return `https://outlook.live.com/calendar/0/addfromweb?${params.toString()}`;
};

// One-time download of every upcoming event as a single .ics file (for apps without URL-subscribe support)
export const downloadAllEventsICS = (): void => {
  const link = document.createElement('a');
  link.href = getEventsFeedUrl();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Apple Calendar (and most other calendar apps) import events from a downloaded .ics file
export const downloadICSFile = (event: FacebookEventData): void => {
  const content = buildICSContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = event.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  link.download = `${safeName || 'event'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
