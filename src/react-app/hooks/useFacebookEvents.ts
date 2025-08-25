import { useQuery } from '@tanstack/react-query';

import { FacebookEventsResponse, FacebookEventData, FacebookEventPlace } from '../../worker/facebookEvent'


// Parameters for the API call
export interface EventsQueryParams {
    since?: string; // YYYY-MM-DD format
    until?: string; // YYYY-MM-DD format
    limit?: number;
    fields?: string;
}

// Hook options
export interface UseFacebookEventsOptions extends EventsQueryParams {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
    cacheTime?: number;
}

// API call function - returns raw Facebook API response
const fetchFacebookEvents = async (params: EventsQueryParams = {}): Promise<FacebookEventsResponse> => {
    const searchParams = new URLSearchParams();

    if (params.since) searchParams.append('since', params.since);
    if (params.until) searchParams.append('until', params.until);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `/api/events${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// React Query hook for raw Facebook API data
export const useFacebookEvents = (options: UseFacebookEventsOptions = {}) => {
    const {
        since,
        until,
        limit = 50,
        enabled = true,
        refetchInterval,
        staleTime = 1 * 60 * 60 * 1000, // 60 minutes
    } = options;

    const queryKey = ['facebook-events', { since, until, limit }];

    return useQuery<FacebookEventsResponse, Error>({
        queryKey,
        queryFn: () => fetchFacebookEvents({ since, until, limit }),
        enabled,
        refetchInterval,
        staleTime,
        retry: (failureCount, error) => {
            // Don't retry on 4xx errors (client errors)
            if (error.message.includes('40')) return false;
            return failureCount < 3;
        },
    });
};

// Utility hook for upcoming events only
export const useUpcomingFacebookEvents = (options: Omit<UseFacebookEventsOptions, 'since'> = {}) => {
    const today = new Date().toISOString().split('T')[0];

    return useFacebookEvents({
        ...options,
        since: today, // Only get events from today onwards
    });
};

// Utility hook with manual refetch capability
export const useFacebookEventsWithRefetch = (options: UseFacebookEventsOptions = {}) => {
    const query = useFacebookEvents(options);

    return {
        ...query,
        refresh: () => query.refetch(),
        isRefreshing: query.isFetching && !query.isLoading,
    };
};

// Helper functions for working with raw Facebook data
export const isUpcoming = (startTime: string): boolean => {
    return new Date(startTime) > new Date();
};

export const getUpcomingEvents = (events: FacebookEventData[]): FacebookEventData[] => {
    return events
        .filter(event => isUpcoming(event.start_time))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
};

export const getPastEvents = (events: FacebookEventData[]): FacebookEventData[] => {
    return events
        .filter(event => !isUpcoming(event.start_time))
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
};

export const getEventsByDateRange = (
    events: FacebookEventData[],
    startDate: string,
    endDate: string
): FacebookEventData[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate >= start && eventDate <= end;
    });
};

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

// Helper to format event time
export const formatEventTime = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };

    let formatted = start.toLocaleDateString('en-US', options);

    if (endTime) {
        const end = new Date(endTime);
        const endTimeStr = end.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        formatted += ` - ${endTimeStr}`;
    }

    return formatted;
};