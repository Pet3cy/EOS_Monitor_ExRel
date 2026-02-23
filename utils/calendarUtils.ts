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
    const yearStart = new Date(year, 0, 1);

    // Find first Monday of the year (ISO week standard often uses Monday)
    const day = yearStart.getDay();
    const diff = yearStart.getDate() - day + (day === 0 ? -6 : 1);
    const firstMonday = new Date(yearStart.setDate(diff));
    firstMonday.setHours(0, 0, 0, 0);

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

    // Ensure range dates are set to midnight local time
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    const oneDayMs = 1000 * 60 * 60 * 24;
    // Create array for potential weeks (54 to cover leap years/overflow)
    const weeks: (WeekData | null)[] = new Array(54).fill(null);

    // Initialize weeks that are within range
    for (let i = 0; i < 54; i++) {
        // Use Date object manipulation to be safe against DST
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + i * 7);
        weekStart.setHours(0, 0, 0, 0);

        if (weekStart.getFullYear() > year) {
             break;
        }

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(0, 0, 0, 0);

        // Range check
        if (weekEnd < rangeStart || weekStart > rangeEnd) continue;

        const currentWeekDays: DayData[] = [];
        for (let d = 0; d < 7; d++) {
            const dDate = new Date(weekStart);
            dDate.setDate(weekStart.getDate() + d);
            currentWeekDays.push({
                date: dDate,
                dateString: toDateString(dDate),
                events: []
            });
        }

        weeks[i] = {
            number: i + 1,
            start: weekStart,
            end: weekEnd,
            days: currentWeekDays,
            events: []
        };
    }

    // Optimization: Iterate events and place in buckets (O(N))
    for (const event of events) {
        if (priorityFilter !== 'All' && event.analysis.priority !== priorityFilter) continue;
        if (themeFilter !== 'All' && event.analysis.theme !== themeFilter) continue;

        const eventDate = parseDate(event.analysis.date);
        eventDate.setHours(0, 0, 0, 0);

        if (isNaN(eventDate.getTime())) continue;

        // Use Math.round to handle DST shifts robustly
        const diffTime = eventDate.getTime() - firstMonday.getTime();
        const dayDiffTotal = Math.round(diffTime / oneDayMs);
        const weekIdx = Math.floor(dayDiffTotal / 7);

        if (weekIdx >= 0 && weekIdx < weeks.length && weeks[weekIdx]) {
            const week = weeks[weekIdx]!;
            week.events.push(event);

            // Calculate day index (0-6)
            const dayIdx = dayDiffTotal - (weekIdx * 7);

            if (dayIdx >= 0 && dayIdx < 7) {
                week.days[dayIdx].events.push(event);
            }
        }
    }

    // Filter out nulls and apply empty-week filtering logic
    const finalWeeks: WeekData[] = [];
    for (const week of weeks) {
        if (!week) continue;

        const hasMatches = week.events.length > 0;
        if (!hasMatches && (priorityFilter !== 'All' || themeFilter !== 'All')) continue;

        finalWeeks.push(week);
    }

    return finalWeeks;
}
