import { Dropdown, Modal } from "antd";
import type { MenuProps } from "antd";
import { CalendarPlus, ExternalLink } from "lucide-react";
import { FacebookEventData } from "../worker/facebookEvent";
import { formatEventTime, getEventAddress } from "./hooks/useFacebookEvents";
import { downloadICSFile, getGoogleCalendarUrl, getOutlookCalendarUrl } from "./utils/calendarExport";

interface EventDetailsModalProps {
  event: FacebookEventData | null;
  onClose: () => void;
}

export const EventDetailsModal = ({ event, onClose }: EventDetailsModalProps) => {
  const exportMenuItems: MenuProps['items'] = [
    { key: 'google', label: 'Google Calendar' },
    { key: 'outlook', label: 'Outlook' },
    { key: 'apple', label: 'Apple Calendar (.ics)' },
  ];

  const handleExportClick: MenuProps['onClick'] = ({ key }) => {
    if (!event) return;
    if (key === 'google') {
      window.open(getGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
    } else if (key === 'outlook') {
      window.open(getOutlookCalendarUrl(event), '_blank', 'noopener,noreferrer');
    } else if (key === 'apple') {
      downloadICSFile(event);
    }
  };

  const address = event ? getEventAddress(event.place) : '';

  return (
    <Modal
      open={!!event}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      className="event-modal"
    >
      {event && (
        <>
          {event.cover?.source && (
            <img src={event.cover.source} alt={event.name} className="event-modal-cover" />
          )}
          <div className="event-modal-body">
            <h3 className="event-modal-title">{event.name}</h3>
            <p className="event-modal-meta">{formatEventTime(event.start_time, event.end_time)}</p>
            {address && <p className="event-modal-meta">{address}</p>}
            {event.description && (
              <p className="event-modal-description">{event.description}</p>
            )}
            <div className="event-modal-actions">
              <a
                href={`https://www.facebook.com/events/${event.id}/`}
                target="_blank"
                rel="noreferrer"
                className="event-modal-fb-link"
              >
                View on Facebook <ExternalLink size={12} />
              </a>
              <Dropdown
                menu={{ items: exportMenuItems, onClick: handleExportClick }}
                trigger={['click']}
                placement="bottomRight"
              >
                <button type="button" className="subscribe-all-btn">
                  <CalendarPlus size={14} />
                  <span>Add to calendar</span>
                </button>
              </Dropdown>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
