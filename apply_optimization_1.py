import sys

with open('components/CalendarView.tsx', 'r') as f:
    content = f.read()

search = """import { generateCalendarWeeks } from '../utils/calendarUtils';

interface CalendarViewProps {
  events: EventData[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');"""

replace = """import { generateCalendarWeeks } from '../utils/calendarUtils';

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return ;
};

const currentMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });

const todayKey = toDateString(new Date());

interface CalendarViewProps {
  events: EventData[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');"""

if search in content:
    new_content = content.replace(search, replace)
    with open('components/CalendarView.tsx', 'w') as f:
        f.write(new_content)
    print("Optimization 1 applied")
else:
    print("Optimization 1 search block not found")
