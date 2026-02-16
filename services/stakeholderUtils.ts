import type { EventData } from '../types';

export interface StakeholderStats {
  name: string;
  completedEvents: EventData[];
  allEvents: EventData[];
  themes: string[];
  papers: string[];
}

export const aggregateStakeholders = (events: EventData[]): StakeholderStats[] => {
  const groups: Record<string, {
    completedEvents: EventData[];
    allEvents: EventData[];
    themes: Set<string>;
    papers: Set<string>;
  }> = {};

  events.forEach(event => {
    // Normalize institution name slightly to group better
    const name = event.analysis.institution.trim() || 'Unknown Stakeholder';

    if (!groups[name]) {
      groups[name] = {
        completedEvents: [],
        allEvents: [],
        themes: new Set(),
        papers: new Set()
      };
    }

    groups[name].allEvents.push(event);
    groups[name].themes.add(event.analysis.theme);
    event.analysis.linkedActivities.forEach(a => groups[name].papers.add(a));

    if (event.followUp.status.startsWith('Completed')) {
      groups[name].completedEvents.push(event);
    }
  });

  return Object.entries(groups)
    .map(([name, data]) => ({
      name,
      ...data,
      themes: Array.from(data.themes),
      papers: Array.from(data.papers)
    }))
    .sort((a, b) => b.allEvents.length - a.allEvents.length); // Sort by most active stakeholder
};
