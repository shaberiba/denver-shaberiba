import { FacebookEventData, expandRecurringEvents, getEventAddress } from "./facebookEvent";

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // fallback when Facebook doesn't provide an end time

const facebookEventUrl = (id: string): string => `https://www.facebook.com/events/${id}/`;

const getEventTimes = (event: FacebookEventData): { start: Date; end: Date } => {
    const start = new Date(event.start_time);
    const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + DEFAULT_DURATION_MS);
    return { start, end };
};

const toUTCTimestamp = (date: Date): string => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const buildDescription = (event: FacebookEventData): string => {
    const parts = [event.description, `More info: ${facebookEventUrl(event.id)}`].filter(Boolean);
    return parts.join('\n\n');
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

const buildEventBlock = (event: FacebookEventData, dtstamp: string): string[] => {
    const { start, end } = getEventTimes(event);
    const location = getEventAddress(event.place);

    return [
        'BEGIN:VEVENT',
        `UID:${event.id}@denver-shaberiba`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${toUTCTimestamp(start)}`,
        `DTEND:${toUTCTimestamp(end)}`,
        `SUMMARY:${escapeICSText(event.name)}`,
        `DESCRIPTION:${escapeICSText(buildDescription(event))}`,
        location ? `LOCATION:${escapeICSText(location)}` : undefined,
        `URL:${facebookEventUrl(event.id)}`,
        'END:VEVENT',
    ].filter((line): line is string => Boolean(line));
};

// Builds a single .ics file containing every (expanded) future event, for bulk import/subscription
export const buildEventsICS = (events: FacebookEventData[]): string => {
    const dtstamp = toUTCTimestamp(new Date());
    const now = Date.now();

    const futureEvents = expandRecurringEvents(events)
        .filter(evt => new Date(evt.start_time).getTime() >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Denver Shaberiba//Events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Denver Shaberiba Events',
        ...futureEvents.flatMap(evt => buildEventBlock(evt, dtstamp)),
        'END:VCALENDAR',
    ];

    return lines.map(foldICSLine).join('\r\n');
};
