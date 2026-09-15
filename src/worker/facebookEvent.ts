export interface FacebookEventTime {
    id: string;
    start_time: string;
    end_time: string;
}

export interface FacebookEventPlace {
    name: string;
    location?: {
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
        state?: string;
        street?: string;
        zip?: string;
    };
    id?: string;
}

export interface FacebookEventData {
    id: string;
    name: string;
    description?: string;
    start_time: string;
    end_time?: string;
    place?: FacebookEventPlace;
    cover?: {
        source: string;
    };
    attending_count?: number;
    interested_count?: number;
    event_times?: FacebookEventTime[]; // For recurring events
}
export interface FacebookEventsResponse {
    data: FacebookEventData[]
    paging?: {
        next?: string
        previous?: string
    }
}

// Helper to expand recurring events into individual instances
export const expandRecurringEvents = (events: FacebookEventData[]): FacebookEventData[] => {
    const expandedEvents: FacebookEventData[] = [];

    events.forEach(event => {
        if (event.event_times && event.event_times.length > 0) {
            // Create separate event instances for each occurrence
            event.event_times.forEach(eventTime => {
                expandedEvents.push({
                    ...event,
                    id: eventTime.id,
                    start_time: eventTime.start_time,
                    end_time: eventTime.end_time,
                    event_times: undefined, // Remove event_times from individual instances
                });
            });
        } else {
            // Regular single event
            expandedEvents.push(event);
        }
    });

    return expandedEvents;
};

// Helper to get full address string from place object
export const getEventAddress = (place?: FacebookEventPlace): string => {
    if (!place?.location) return place?.name || '';

    const { street, city, state, zip } = place.location;
    const parts = [street, city, state, zip].filter(Boolean);
    return parts.join(', ');
};