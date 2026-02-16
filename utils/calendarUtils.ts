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

    // Optimization: Pre-process and sort events by date
    // This reduces date parsing from O(W*N) to O(N) and uses binary/linear scan logic (O(N + W)).
    const processedEvents = events
      .map(event => {
        const d = new Date(event.analysis.date);
        return {
          original: event,
          time: d.getTime()
        };
      })
      .filter(item => !isNaN(item.time));

    // Sort by time ascending
    processedEvents.sort((a, b) => a.time - b.time);

    let eventIndex = 0;

    for (let i = 0; i < 53; i++) { // Some years have 53 weeks
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekStartTime = weekStart.getTime();
      const weekEndTime = weekEnd.getTime();

      // Stop if we've passed the target year entirely
      if (weekStart.getFullYear() > year) break;

      // Filter weeks that overlap with the user's selected date range
      if (weekEnd < rangeStart || weekStart > rangeEnd) continue;

      // Skip events strictly before this week
      // Since weeks are sequential and events are sorted, we can permanently advance the index.
      while (eventIndex < processedEvents.length && processedEvents[eventIndex].time < weekStartTime) {
        eventIndex++;
      }

      // Collect events for this week
      const weekEvents: EventData[] = [];
      let tempIndex = eventIndex;

      while (tempIndex < processedEvents.length) {
        const ev = processedEvents[tempIndex];

        // If event is after this week, we can stop scanning for this week.
        // Since events are sorted, all subsequent events are also after this week.
        if (ev.time > weekEndTime) break;

        // Apply filters
        const matchesPriority = priorityFilter === 'All' || ev.original.analysis.priority === priorityFilter;
        const matchesTheme = themeFilter === 'All' || ev.original.analysis.theme === themeFilter;

        if (matchesPriority && matchesTheme) {
          weekEvents.push(ev.original);
        }

        tempIndex++;
      }

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
