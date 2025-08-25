import { expandRecurringEvents, useFacebookEvents } from "./hooks/useFacebookEvents";
import { FacebookEventData } from "../worker/facebookEvent";
import { Badge, Calendar, Spin } from "antd";
import dayjs, { Dayjs } from 'dayjs'

import { useMemo } from "react";

const dateFormat = 'YYYY-MM-DD'


export const FacebookEventsCalendar = () => {

    const { data: eventData, isLoading, error } = useFacebookEvents({
        since: '2025-01-01T00:00:00'
    });


    if (error) {
        return <>{error}</>
    }



    return <EventCalendar loading={isLoading} data={eventData?.data ?? []} />
}


interface EventCalendarProps {
    data: FacebookEventData[];
    loading: boolean;
}

const EventCalendar = ({ data, loading }: EventCalendarProps) => {

    const allEvents: Record<string, FacebookEventData[]> = useMemo(() => {
        if (!data) {
            return {}
        }
        const mapping: Record<string, FacebookEventData[]> = {}
        for (const evt of expandRecurringEvents(data)) {
            const date = dayjs(evt.start_time).format(dateFormat)
            if (date in mapping) {
                const events = [...mapping[date], evt];
                mapping[date] = events
            } else {
                mapping[date] = [evt]
            }
        }
        return mapping
    }, [data])


    const cellRenderer = (value: Dayjs) => {
        const cellDate = value.format(dateFormat)
        if (cellDate in allEvents) {
            const dayEvents = allEvents[cellDate]
            return (dayEvents.map(fbe => <Badge status="success">{`${fbe.name} @ ${fbe.place?.name}`}</Badge>))
        }
        else {
            return
        }
    }

    return (
        <div style={{ maxWidth: 700, height: 600, padding: '2rem', borderRadius: 30, border: '1px solid #e5e5e5' }}>
            {loading && <Spin size="large" style={{ zIndex: 10, position: 'relative', top: '50%', left: '50%' }} />}
            <Calendar style={{ opacity: loading ? .5 : 1 }} fullscreen={false} cellRender={cellRenderer} />
        </div>)


}