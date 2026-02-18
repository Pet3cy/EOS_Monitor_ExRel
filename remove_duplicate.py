import sys

with open('components/CalendarView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_next = False

for line in lines:
    if "const currentMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });" in line:
        # Check if it is the one inside (indented)
        if line.startswith('  const'):
            continue
    new_lines.append(line)

with open('components/CalendarView.tsx', 'w') as f:
    f.writelines(new_lines)

print("Removed duplicate currentMonthName")
