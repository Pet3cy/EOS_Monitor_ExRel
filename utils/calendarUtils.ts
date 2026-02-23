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

    if (isNaN(rangeStart.getTime())) {
        rangeStart = new Date(startDateFilter);
    }
    if (isNaN(rangeEnd.getTime())) {
        rangeEnd = new Date(endDateFilter);
    }

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return [];
    }

    // Optimization: Use a Map for O(1) lookups instead of sorting O(N log N)
    const eventsByDate = new Map<string, EventData[]>();

    for (const event of events) {
        if (priorityFilter !== 'All' && event.analysis.priority !== priorityFilter) continue;
        if (themeFilter !== 'All' && event.analysis.theme !== themeFilter) continue;

        const date = parseDate(event.analysis.date);
        if (isNaN(date.getTime())) continue;

        const dateKey = toDateString(date);
        if (!eventsByDate.has(dateKey)) {
            eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(event);
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

      const currentWeekDays: DayData[] = [];
      const currentWeekEvents: EventData[] = [];

      // Initialize days for this week
      for (let d = 0; d < 7; d++) {
          const dDate = new Date(weekStart);
          dDate.setDate(weekStart.getDate() + d);
          const dateKey = toDateString(dDate);

          const dayEvents = eventsByDate.get(dateKey) || [];

          currentWeekDays.push({
              date: dDate,
              dateString: dateKey,
              events: dayEvents
          });

          if (dayEvents.length > 0) {
              currentWeekEvents.push(...dayEvents);
          }
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
