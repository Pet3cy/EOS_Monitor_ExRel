
import React, { useState, useMemo } from 'react';
import { EventData, Priority } from '../types';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Tag,
  ChevronRight,
  Search
} from 'lucide-react';

interface CalendarViewProps {
  events: EventData[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [themeFilter, setThemeFilter] = useState<string>('All');
  const [contactFilter, setContactFilter] = useState<string>('All');
  const currentYear = new Date().getFullYear();
  const [startDateFilter, setStartDateFilter] = useState<string>(`${currentYear}-01-01`);
  const [endDateFilter, setEndDateFilter] = useState<string>(`${currentYear}-12-31`);
  const [calendarView, setCalendarView] = useState<'Week' | 'Month' | 'Trimester' | 'Semester' | 'Year'>('Week');

  // Get unique themes for the filter
  const themes = useMemo(() => {
    const uniqueThemes = new Set(events.map(e => e.analysis.theme));
    return ['All', ...Array.from(uniqueThemes)].sort();
  }, [events]);

  const contacts = useMemo(() => {
    const uniqueContacts = new Set(events.map(e => e.contact.name).filter(Boolean));
    return ['All', ...Array.from(uniqueContacts)].sort();
  }, [events]);

  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Pre-filter events and parse their dates once, memoized separately
  // so that changes to date range or calendar view don't re-run this.
  const preFilteredEvents = useMemo(() =>
    events
      .filter(
        (event) =>
          (priorityFilter === 'All' || event.analysis.priority === priorityFilter) &&
          (themeFilter === 'All' || event.analysis.theme === themeFilter) &&
          (contactFilter === 'All' || event.contact.name === contactFilter)
      )
      .map((event) => ({
        event,
        time: new Date(event.analysis.date).getTime(),
      })),
    [events, priorityFilter, themeFilter, contactFilter]
  );

  // Generate and filter weeks
  const filteredWeeks = useMemo(() => {
    if (calendarView !== 'Week') return [];
    const weeksArr = [];

    const rangeStart = new Date(startDateFilter);
    const rangeEnd = new Date(endDateFilter);

    // Ensure range dates are valid
    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return [];
    }

    const yearStart = new Date(rangeStart.getFullYear(), 0, 1);
    const dayOfWeek = yearStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMondayTime = new Date(yearStart.getFullYear(), 0, 1 + daysToMonday).getTime();

    for (let i = 0; i < 53 * (rangeEnd.getFullYear() - rangeStart.getFullYear() + 1); i++) {
      const weekStart = new Date(firstMondayTime + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      // Stop if we've passed the end year
      if (weekStart.getFullYear() > rangeEnd.getFullYear()) break;
      
      // Filter weeks that overlap with the user's selected date range
      if (weekEnd < rangeStart || weekStart > rangeEnd) continue;

      // Find events in this week
      const weekStartMs = weekStart.getTime();
      const weekEndMs = weekEnd.getTime();
      const weekEvents = preFilteredEvents
        .filter(item => item.time >= weekStartMs && item.time <= weekEndMs)
        .map(item => item.event);

      const hasMatches = weekEvents.length > 0;
      if (!hasMatches && (priorityFilter !== 'All' || themeFilter !== 'All' || contactFilter !== 'All')) continue;

      weeksArr.push({
        number: (i % 53) + 1,
        start: weekStart,
        end: weekEnd,
        events: weekEvents
      });
    }
    return weeksArr;
  }, [preFilteredEvents, priorityFilter, themeFilter, contactFilter, startDateFilter, endDateFilter, calendarView]);

  const filteredPeriods = useMemo(() => {
    if (calendarView === 'Week') return [];

    const rangeStart = new Date(startDateFilter);
    const rangeEnd = new Date(endDateFilter);

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return [];
    }

    const rangeStartMs = rangeStart.getTime();
    const rangeEndMs = rangeEnd.getTime();
    
    // Reuse preFilteredEvents (already filtered by priority/theme/contact)
    // and apply date range filter
    const filteredEvents = preFilteredEvents
        .filter(item => item.time >= rangeStartMs && item.time <= rangeEndMs)
        .map(item => item.event);

    // Group events based on viewType
    const grouped = new Map<string, EventData[]>();
    
    filteredEvents.forEach(event => {
        const date = new Date(event.analysis.date);
        let key = '';
        if (calendarView === 'Month') {
            key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } else if (calendarView === 'Trimester') {
            const month = date.getMonth();
            const trimester = Math.floor(month / 4) + 1; // 0-3 = 1, 4-7 = 2, 8-11 = 3
            key = `Trimester ${trimester} ${date.getFullYear()}`;
        } else if (calendarView === 'Semester') {
            const semester = date.getMonth() < 6 ? 1 : 2;
            key = `Semester ${semester} ${date.getFullYear()}`;
        } else if (calendarView === 'Year') {
            key = `${date.getFullYear()}`;
        }
        
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(event);
    });

    return Array.from(grouped.entries()).map(([title, evs]) => ({
        title,
        events: evs.sort((a, b) => new Date(a.analysis.date).getTime() - new Date(b.analysis.date).getTime())
    }));
  }, [preFilteredEvents, calendarView, startDateFilter, endDateFilter]);

  const currentMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });

  const resetFilters = () => {
    setPriorityFilter('All');
    setThemeFilter('All');
    setContactFilter('All');
    setStartDateFilter('2026-01-01');
    setEndDateFilter('2026-12-31');
    setCalendarView('Week');
  };

  const isFiltered = priorityFilter !== 'All' || themeFilter !== 'All' || contactFilter !== 'All' || startDateFilter !== '2026-01-01' || endDateFilter !== '2026-12-31' || calendarView !== 'Week';

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Calendar Overview</h2>
              <p className="text-slate-500 text-sm font-medium">Coordinate upcoming advocacy and organizational milestones.</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <span className="text-6xl font-black text-slate-100 select-none">2026</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-6">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <Filter size={16} className="text-blue-600" />
            Roadmap Filters
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Priority Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['All', Priority.High, Priority.Medium, Priority.Low] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      priorityFilter === p 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Theme</label>
              <select 
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {themes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Contact Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Contact</label>
              <select 
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {contacts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* View Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View</label>
              <select 
                value={calendarView}
                onChange={(e) => setCalendarView(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Week">Week</option>
                <option value="Month">Month</option>
                <option value="Trimester">Trimester</option>
                <option value="Semester">Semester</option>
                <option value="Year">Year</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
              <input 
                type="date" 
                value={startDateFilter}
                min="2026-01-01"
                max="2026-12-31"
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={endDateFilter}
                  min="2026-01-01"
                  max="2026-12-31"
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {isFiltered && (
                    <button 
                        onClick={resetFilters}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        title="Clear all filters"
                    >
                        <X size={16} />
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-12">
          {calendarView === 'Week' ? (
            filteredWeeks.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-lg">No roadmap entries found for these filters.</p>
                <p className="text-slate-400 text-sm mt-1">Adjust your date range or priority settings.</p>
                <button 
                  onClick={resetFilters} 
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredWeeks.map((week) => {
                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(week.start);
                  d.setDate(week.start.getDate() + i);
                  return d;
                });

                // Month separator logic
                const isFirstWeekOfMonth = week.start.getDate() <= 7;
                const monthLabel = isFirstWeekOfMonth ? (
                  <div className="mb-6 mt-12">
                    <h3 className="text-xl font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-4">
                      {currentMonthName(week.start)} 
                      <span className="h-px bg-blue-200 flex-1"></span>
                    </h3>
                  </div>
                ) : null;

                return (
                  <React.Fragment key={week.number}>
                    {monthLabel}
                    <div className={`bg-white rounded-2xl border-2 ${isFirstWeekOfMonth ? 'border-blue-300 shadow-md' : 'border-slate-200 shadow-sm'} overflow-hidden`}>
                      {/* Week Header */}
                      <div className={`flex items-center justify-between px-6 py-3 border-b ${isFirstWeekOfMonth ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50/80 border-slate-100'}`}>
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded-md">Week {week.number}</span>
                              <span className="text-xs font-bold text-slate-500">{week.start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {week.end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                          </div>
                      </div>
                      
                      {/* Days Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                          {weekDays.map(day => {
                              const dateKey = toDateString(day);
                              const dayEvents = week.events.filter(e => e.analysis.date === dateKey);
                              const isToday = toDateString(new Date()) === dateKey;
                              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                              const hasConflict = dayEvents.length > 1;

                              return (
                                  <div key={dateKey} className={`min-h-[160px] p-3 flex flex-col group ${isToday ? 'bg-blue-50/20' : isWeekend ? 'bg-slate-50/30' : ''} ${hasConflict ? 'bg-red-50/30 ring-1 ring-red-200 inset-0' : ''} hover:bg-slate-50 transition-colors`}>
                                      <div className="flex items-center justify-between mb-3">
                                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : hasConflict ? 'text-red-600' : 'text-slate-400'}`}>
                                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {hasConflict && <span title="Multiple events scheduled"><AlertCircle size={12} className="text-red-500" /></span>}
                                            <span className={`text-sm font-bold flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-blue-600 text-white' : hasConflict ? 'bg-red-100 text-red-700' : 'text-slate-700'}`}>
                                                {day.getDate()}
                                            </span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex-1 space-y-2">
                                          {dayEvents.map(event => (
                                              <div 
                                                  key={event.id}
                                                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm ${
                                                      event.analysis.priority === Priority.High ? 'bg-white border-l-4 border-l-red-500 border-slate-200' :
                                                      'bg-white border-slate-200'
                                                  } ${hasConflict ? 'shadow-sm border-red-200' : ''}`}
                                                  title={`${event.analysis.eventName} (${event.analysis.priority} Priority)`}
                                              >
                                                  <div className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                                                      {event.analysis.time && <span className="text-blue-600 mr-1">{event.analysis.time}</span>}
                                                      {event.analysis.eventName}
                                                  </div>
                                                  <div className="text-[10px] text-slate-500 font-medium truncate">
                                                      {event.analysis.venue}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )
          ) : (
            filteredPeriods.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-lg">No roadmap entries found for these filters.</p>
                <p className="text-slate-400 text-sm mt-1">Adjust your date range or priority settings.</p>
                <button 
                  onClick={resetFilters} 
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredPeriods.map((period) => (
                <div key={period.title} className="mb-12">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-4">
                      {period.title}
                      <span className="h-px bg-blue-200 flex-1"></span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {period.events.map(event => (
                      <div key={event.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                            event.analysis.priority === Priority.High ? 'bg-red-100 text-red-700' :
                            event.analysis.priority === Priority.Medium ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {event.analysis.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{event.analysis.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1 line-clamp-2" title={event.analysis.eventName}>{event.analysis.eventName}</h4>
                        <p className="text-xs text-slate-500 mb-3 truncate" title={event.analysis.venue}>{event.analysis.venue}</p>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 truncate" title={event.analysis.institution}>
                          <Building2 size={14} className="shrink-0" /> <span className="truncate">{event.analysis.institution}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
