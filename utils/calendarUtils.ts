import { EventData, Priority } from '../types';

export interface WeekData {
  number: number;
  start: Date;
  end: Date;
  events: EventData[];
}

export function generateCalendarWeeks(
  events: EventData[],
  year: number,
  startDateFilter: string,
  endDateFilter: string,
  priorityFilter: Priority | 'All',
  themeFilter: string
): WeekData[] {
    const weeksArr: WeekData[] = [];
    const yearStart = new Date(year, 0, 1);

    // Find first Monday of the year (ISO week standard often uses Monday)
    const day = yearStart.getDay();
    const diff = yearStart.getDate() - day + (day === 0 ? -6 : 1);
    const firstMonday = new Date(yearStart.setDate(diff));

    const rangeStart = new Date(startDateFilter);
    const rangeEnd = new Date(endDateFilter);

    // Ensure range dates are valid
    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return [];
    }

    for (let i = 0; i < 53; i++) { // Some years have 53 weeks
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Stop if we've passed the target year entirely
      if (weekStart.getFullYear() > year) break;

      // Filter weeks that overlap with the user's selected date range
      if (weekEnd < rangeStart || weekStart > rangeEnd) continue;

      // Find events in this week that match all filters
      const weekEvents = events.filter(event => {
        const eventDate = new Date(event.analysis.date);
        const matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
        const matchesPriority = priorityFilter === 'All' || event.analysis.priority === priorityFilter;
        const matchesTheme = themeFilter === 'All' || event.analysis.theme === themeFilter;
        return matchesDate && matchesPriority && matchesTheme;
      });

      // Optimisation: If filtering by specific priority/theme, only show weeks that have those matches.
      const hasMatches = weekEvents.length > 0;
      if (!hasMatches && (priorityFilter !== 'All' || themeFilter !== 'All')) continue;

      weeksArr.push({
        number: i + 1,
        start: weekStart,
        end: weekEnd,
        events: weekEvents
      });
    }
    return weeksArr;
}
