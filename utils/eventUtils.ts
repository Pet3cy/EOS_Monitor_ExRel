import { EventData } from '../types';

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
