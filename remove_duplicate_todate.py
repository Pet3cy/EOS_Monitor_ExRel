import sys

with open('components/CalendarView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for line in lines:
    if "const toDateString = (date: Date) => {" in line:
        if line.startswith('  const'):
            skip = True
            continue

    if skip:
        if "return `${year}-${month}-${day}`;" in line:
            # this is inside toDateString
            continue
        if "};" in line and skip: # End of function
            skip = False
            continue
        if "const day = " in line or "const month =" in line or "const year =" in line:
             continue

    new_lines.append(line)

with open('components/CalendarView.tsx', 'w') as f:
    f.writelines(new_lines)

print("Removed duplicate toDateString")
