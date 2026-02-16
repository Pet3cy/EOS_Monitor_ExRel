import { EventData, ViewMode } from '../types';

/**
 * Creates a deep copy of an EventData object.
 * This function is significantly faster than structuredClone or JSON.parse(JSON.stringify)
 * because it manually copies known properties, avoiding generic traversal.
 */
export function deepCopyEvent(event: EventData): EventData {
  return {
    ...event,
    analysis: {
      ...event.analysis,
      linkedActivities: [...(event.analysis.linkedActivities || [])]
    },
    contact: {
      ...event.contact
    },
    followUp: {
      ...event.followUp,
      commsPack: {
        ...event.followUp.commsPack
      }
    }
  };
}

/**
 * Checks if an event status is considered completed or archived.
 */
export function isCompletedOrArchived(status: string): boolean {
  return status.startsWith('Completed') || status === 'Not Relevant';
}

/**
 * Filters events based on search term and view mode.
 *
 * @param events - The list of events to filter.
 * @param searchTerm - The search string to filter by event name or institution.
 * @param viewMode - The current view mode which dictates status filtering (upcoming vs past).
 * @returns A filtered list of EventData.
 */
export function filterEvents(events: EventData[], searchTerm: string, viewMode: ViewMode): EventData[] {
  const lowerSearchTerm = searchTerm.toLowerCase();

  return events.filter(e => {
    // 1. Filter by search term
    const matchesSearch =
      e.analysis.eventName.toLowerCase().includes(lowerSearchTerm) ||
      e.analysis.institution.toLowerCase().includes(lowerSearchTerm);

    if (!matchesSearch) return false;

    // 2. Filter by status based on viewMode
    if (viewMode === 'upcoming') {
      return !isCompletedOrArchived(e.followUp.status);
    } else if (viewMode === 'past') {
      return isCompletedOrArchived(e.followUp.status);
    }

    // For other view modes (calendar, overview, contacts), we only filter by search term
    return true;
  });
}
