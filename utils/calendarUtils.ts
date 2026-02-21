import { EventData, Priority } from '../types';

export interface DayData {
  date: Date;
  dateString: string;
  events: EventData[];
}

export interface WeekData {
  number: number;
  start: Date;
  end: Date;
  days: DayData[];
  events: EventData[];
}

// Helper to ensure local date parsing from YYYY-MM-DD string
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);

  const [y, m, d] = parts.map(Number);
  return new Date(y, m - 1, d);
};

// Helper for date string (Local)
const toDateString = (date: Date): string => {
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

    let rangeStart = parseDate(startDateFilter);
    let rangeEnd = parseDate(endDateFilter);

    // Fallback if invalid (though input type="date" usually ensures valid YYYY-MM-DD)
    if (isNaN(rangeStart.getTime())) rangeStart = new Date(startDateFilter);
    if (isNaN(rangeEnd.getTime())) rangeEnd = new Date(endDateFilter);

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
        date: parseDate(event.analysis.date) // Use local parsing
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
      const currentWeekDays: DayData[] = [];

      // Initialize days for this week
      for (let d = 0; d < 7; d++) {
          const dDate = new Date(weekStart);
          dDate.setDate(weekStart.getDate() + d);
          currentWeekDays.push({
              date: dDate,
              dateString: toDateString(dDate),
              events: []
          });
      }

      // Skip events before this week (O(N) total over all iterations)
      while (eventIndex < processedEvents.length && processedEvents[eventIndex].date < weekStart) {
        eventIndex++;
      }

      // Collect events in this week AND distribute to days
      while (eventIndex < processedEvents.length && processedEvents[eventIndex].date <= weekEnd) {
        const pEvent = processedEvents[eventIndex];
        currentWeekEvents.push(pEvent.original);

        // Find correct day bucket
        const dayDiff = Math.round((pEvent.date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < 7) {
            currentWeekDays[dayDiff].events.push(pEvent.original);
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
        days: currentWeekDays,
        events: currentWeekEvents
      });
    }
    return weeksArr;
}
