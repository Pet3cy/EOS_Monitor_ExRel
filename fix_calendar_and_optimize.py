import sys

# Read the file
with open('components/CalendarView.tsx', 'r') as f:
    content = f.read()

# 1. Fix helpers (replacing the broken one I created earlier)
# The broken one has "return ;"
bad_helper = """const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return ;
};"""

good_helper = """const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};"""

if bad_helper in content:
    content = content.replace(bad_helper, good_helper)
else:
    print("Warning: bad_helper block not found. It might be slightly different.")

# Also ensure currentMonthName and todayKey are there.
# currentMonthName is likely there after the bad_helper block.
# I want to add `const todayKey = toDateString(new Date());` after `currentMonthName`.

current_month_def = "const currentMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });"
today_key_def = "const todayKey = toDateString(new Date());"

if current_month_def in content and today_key_def not in content:
    content = content.replace(current_month_def, current_month_def + "\n\n" + today_key_def)

# 2. Remove duplicate definitions inside CalendarView if any (from original file)
# In original file, toDateString and currentMonthName were inside component.
# My first attempt might have added them outside but failed to remove them inside?
# Or maybe I replaced the whole block?
# Let's check for duplicate definitions inside the component.
# This is tricky without parsing. Let's skip for now and rely on Typescript/Linter to complain or visual check.

# 3. Optimize loop
# Find the loop start
loop_start_marker = """            filteredWeeks.map((week) => {
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(week.start);
                d.setDate(week.start.getDate() + i);
                return d;
              });"""

if loop_start_marker in content:
    # Check if already optimized
    if "const eventsByDate = new Map" not in content:
        optimized_loop_start = loop_start_marker + """

              // Optimization: Group events by date to avoid O(N) filtering per day
              const eventsByDate = new Map<string, EventData[]>();
              for (const event of week.events) {
                const d = event.analysis.date;
                if (!eventsByDate.has(d)) {
                  eventsByDate.set(d, []);
                }
                eventsByDate.get(d)!.push(event);
              }"""
        content = content.replace(loop_start_marker, optimized_loop_start)
        print("Loop start optimized.")
    else:
        print("Loop start already optimized.")
else:
    print("Warning: loop_start_marker not found.")

# 4. Optimize inner loop
inner_loop_marker = """                        {weekDays.map(day => {
                            const dateKey = toDateString(day);
                            const dayEvents = week.events.filter(e => e.analysis.date === dateKey);
                            const isToday = toDateString(new Date()) === dateKey;"""

if inner_loop_marker in content:
    optimized_inner_loop = """                        {weekDays.map(day => {
                            const dateKey = toDateString(day);
                            const dayEvents = eventsByDate.get(dateKey) || [];
                            const isToday = todayKey === dateKey;"""
    content = content.replace(inner_loop_marker, optimized_inner_loop)
    print("Inner loop optimized.")
else:
    print("Warning: inner_loop_marker not found.")

# Write back
with open('components/CalendarView.tsx', 'w') as f:
    f.write(content)
