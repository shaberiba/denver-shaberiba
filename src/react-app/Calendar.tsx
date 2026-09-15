import { expandRecurringEvents, useFacebookEvents } from "./hooks/useFacebookEvents";
import {
  downloadAllEventsICS,
  getGoogleCalendarSubscribeUrl,
  getOutlookCalendarSubscribeUrl,
  getWebcalFeedUrl,
} from "./utils/calendarExport";
import { EventDetailsModal } from "./EventDetailsModal";
import { FacebookEventData } from "../worker/facebookEvent";
import { Badge, Calendar, Dropdown, Spin } from "antd";
import type { MenuProps } from "antd";
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";

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
  const [selectedEvent, setSelectedEvent] = useState<FacebookEventData | null>(null);

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
        <button
          key={fbe.id}
          type="button"
          className="event-link"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(fbe);
          }}
        >
          <Badge
            color="#C8102E"
            text={
              <span style={{ fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--text)' }}>
                {time} · {fbe.name}
              </span>
            }
          />
        </button>
      );
    });
  };

  const subscribeAllMenuItems: MenuProps['items'] = [
    { key: 'google', label: 'Google Calendar' },
    { key: 'outlook', label: 'Outlook' },
    { key: 'apple', label: 'Apple Calendar' },
    { key: 'download', label: 'Download all (.ics)' },
  ];
  const handleSubscribeAllClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'google') {
      window.open(getGoogleCalendarSubscribeUrl(), '_blank', 'noopener,noreferrer');
    } else if (key === 'outlook') {
      window.open(getOutlookCalendarSubscribeUrl(), '_blank', 'noopener,noreferrer');
    } else if (key === 'apple') {
      window.location.href = getWebcalFeedUrl();
    } else if (key === 'download') {
      downloadAllEventsICS();
    }
  };

  return (
    <div className="panel anim-2">
      <div className="panel-heading-row">
        <div className="panel-heading">
          <h2 className="panel-heading-en">Upcoming Events</h2>
          <span className="panel-heading-jp">イベント</span>
        </div>
        <Dropdown
          menu={{ items: subscribeAllMenuItems, onClick: handleSubscribeAllClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button type="button" className="subscribe-all-btn">
            <CalendarPlus size={14} />
            <span>Add all to calendar</span>
          </button>
        </Dropdown>
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
          headerRender={({ value, onChange }) => (
            <div className="cal-header">
              <button
                className="cal-header-btn"
                onClick={() => onChange(value.subtract(1, 'month'))}
                aria-label="Previous month"
              >‹</button>
              <span className="cal-header-label">{value.format('MMMM YYYY')}</span>
              <button
                className="cal-header-btn"
                onClick={() => onChange(value.add(1, 'month'))}
                aria-label="Next month"
              >›</button>
            </div>
          )}
        />
      </div>
      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};
