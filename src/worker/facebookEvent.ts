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