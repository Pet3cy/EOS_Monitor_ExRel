import { EventData, Priority } from '../types';

export interface DayData {
    date: Date;
    dateString: string; // YYYY-MM-DD
    events: EventData[];
}

export interface WeekData {
  number: number;
  start: Date;
  end: Date;
  events: EventData[]; // Keeping for backward compatibility and efficient checking
  days: DayData[]; // Optimized for rendering
}

const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

    // Optimization: Pre-process and sort events (O(N log N))
    const processedEvents = events
      .filter(event => {
        if (priorityFilter !== 'All' && event.analysis.priority !== priorityFilter) return false;
        if (themeFilter !== 'All' && event.analysis.theme !== themeFilter) return false;
        return true;
      })
      .map(event => ({
        original: event,
        date: new Date(event.analysis.date)
      }))
      .filter(item => !isNaN(item.date.getTime())) // Filter out invalid dates
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let eventIndex = 0;

    for (let i = 0; i < 53; i++) { // Some years have 53 weeks
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Stop if we've passed the target year entirely
      if (weekStart.getFullYear() > year) break;

      // Filter weeks that overlap with the user's selected date range
      if (weekEnd < rangeStart || weekStart > rangeEnd) continue;

      const currentWeekEvents: EventData[] = [];
      const days: DayData[] = [];

      // Initialize days for this week
      for (let d = 0; d < 7; d++) {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + d);
          days.push({
              date: dayDate,
              dateString: toDateString(dayDate),
              events: []
          });
      }

      // Skip events before this week (O(N) total over all iterations)
      while (eventIndex < processedEvents.length && processedEvents[eventIndex].date < weekStart) {
        eventIndex++;
      }

      // Collect events in this week and distribute to days
      while (eventIndex < processedEvents.length && processedEvents[eventIndex].date <= weekEnd) {
        const evt = processedEvents[eventIndex];
        currentWeekEvents.push(evt.original);

        // Find the day this event belongs to
        // We use string matching to be consistent with how CalendarView was filtering
        const eventDateStr = evt.original.analysis.date;
        const day = days.find(d => d.dateString === eventDateStr);
        if (day) {
            day.events.push(evt.original);
        }

        eventIndex++;
      }

      // If filtering by specific priority/theme, only show weeks that have those matches.
      const hasMatches = currentWeekEvents.length > 0;
      if (!hasMatches && (priorityFilter !== 'All' || themeFilter !== 'All')) continue;

      weeksArr.push({
        number: i + 1,
        start: weekStart,
        end: weekEnd,
        events: currentWeekEvents,
        days: days
      });
    }
    return weeksArr;
}
