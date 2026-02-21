import React, { useState, useMemo } from 'react';
import { EventData, Priority } from '../types';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  AlertCircle, 
  Building2, 
  MapPin
} from 'lucide-react';
import { generateCalendarWeeks } from '../utils/calendarUtils';

interface CalendarViewProps {
  events: EventData[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [themeFilter, setThemeFilter] = useState<string>('All');
  const [startDateFilter, setStartDateFilter] = useState<string>('2026-01-01');
  const [endDateFilter, setEndDateFilter] = useState<string>('2026-12-31');

  // Get unique themes for the filter
  const themes = useMemo(() => {
    const uniqueThemes = new Set(events.map(e => e.analysis.theme));
    return ['All', ...Array.from(uniqueThemes)].sort();
  }, [events]);

  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate and filter weeks for 2026
  const filteredWeeks = useMemo(() => {
    return generateCalendarWeeks(
      events,
      2026,
      startDateFilter,
      endDateFilter,
      priorityFilter,
      themeFilter
    );
  }, [events, priorityFilter, themeFilter, startDateFilter, endDateFilter]);

  const currentMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });

  const resetFilters = () => {
    setPriorityFilter('All');
    setThemeFilter('All');
    setStartDateFilter('2026-01-01');
    setEndDateFilter('2026-12-31');
  };

  const isFiltered = priorityFilter !== 'All' || themeFilter !== 'All' || startDateFilter !== '2026-01-01' || endDateFilter !== '2026-12-31';

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          {filteredWeeks.length === 0 ? (
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
              // Month separator logic
              const isFirstWeekOfMonth = week.start.getDate() <= 7;
              const monthLabel = isFirstWeekOfMonth ? (
                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                    {currentMonthName(week.start)} 
                    <span className="h-px bg-slate-200 flex-1"></span>
                  </h3>
                </div>
              ) : null;

              return (
                <React.Fragment key={week.number}>
                  {monthLabel}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-950/5">
                    {/* Week Header */}
                    <div className="flex items-center justify-between px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded-md">Week {week.number}</span>
                            <span className="text-xs font-bold text-slate-500">{week.start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {week.end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                        </div>
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {week.days.map(dayData => {
                            const dateKey = dayData.dateString;
                            const isToday = toDateString(new Date()) === dateKey;
                            const isWeekend = dayData.date.getDay() === 0 || dayData.date.getDay() === 6;

                            return (
                                <div key={dateKey} className={`min-h-[160px] p-3 flex flex-col group ${isToday ? 'bg-blue-50/20' : isWeekend ? 'bg-slate-50/30' : ''} hover:bg-slate-50 transition-colors`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                            {dayData.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <span className={`text-sm font-bold flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                            {dayData.date.getDate()}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 space-y-2">
                                        {dayData.events.map(event => (
                                            <div 
                                                key={event.id}
                                                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm ${
                                                    event.analysis.priority === Priority.High ? 'bg-white border-l-4 border-l-red-500 border-slate-200' :
                                                    'bg-white border-slate-200'
                                                }`}
                                                title={`${event.analysis.eventName} (${event.analysis.priority} Priority)`}
                                            >
                                                <div className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
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
          )}
        </div>
      </div>
    </div>
  );
};
