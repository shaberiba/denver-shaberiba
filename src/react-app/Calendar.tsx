import { expandRecurringEvents, useFacebookEvents } from "./hooks/useFacebookEvents";
import { FacebookEventData } from "../worker/facebookEvent";
import { Badge, Calendar, Spin } from "antd";
import dayjs, { Dayjs } from 'dayjs';
import { useMemo } from "react";

const dateFormat = 'YYYY-MM-DD';

export const FacebookEventsCalendar = () => {
  const { data: eventData, isLoading, error } = useFacebookEvents({
    since: '2025-01-01T00:00:00',
  });

  if (error) {
    return (
      <div className="panel anim-2">
        <div className="panel-heading">
          <h2 className="panel-heading-en">Events</h2>
          <span className="panel-heading-jp">イベント</span>
        </div>
        <hr className="panel-rule" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Could not load events. Please try again later.
        </p>
      </div>
    );
  }

  return <EventCalendar loading={isLoading} data={eventData?.data ?? []} />;
};

interface EventCalendarProps {
  data: FacebookEventData[];
  loading: boolean;
}

const EventCalendar = ({ data, loading }: EventCalendarProps) => {
  const allEvents: Record<string, FacebookEventData[]> = useMemo(() => {
    const mapping: Record<string, FacebookEventData[]> = {};
    for (const evt of expandRecurringEvents(data)) {
      const date = dayjs(evt.start_time).format(dateFormat);
      mapping[date] = mapping[date] ? [...mapping[date], evt] : [evt];
    }
    return mapping;
  }, [data]);

  const cellRenderer = (value: Dayjs) => {
    const dayEvents = allEvents[value.format(dateFormat)];
    if (!dayEvents) return null;
    return dayEvents.map(fbe => {
      const time = dayjs(fbe.start_time).format('h:mm A');
      return (
        <Badge
          key={fbe.id}
          color="#C8102E"
          text={
            <span style={{ fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--text)' }}>
              {time} · {fbe.name}
            </span>
          }
        />
      );
    });
  };

  return (
    <div className="panel anim-2">
      <div className="panel-heading">
        <h2 className="panel-heading-en">Upcoming Events</h2>
        <span className="panel-heading-jp">イベント</span>
      </div>
      <hr className="panel-rule" />
      <div className="calendar-panel-inner">
        {loading && (
          <div className="calendar-loading-overlay">
            <Spin size="large" />
          </div>
        )}
        <Calendar
          fullscreen={false}
          cellRender={cellRenderer}
          style={{ opacity: loading ? 0.35 : 1, transition: 'opacity 0.3s ease' }}
        />
      </div>
    </div>
  );
};
