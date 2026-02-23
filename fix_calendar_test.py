file_path = "utils/calendarUtils.test.ts"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
sender_seen = False
in_create_event = False

for line in lines:
    if "const createEvent" in line:
        in_create_event = True

    if in_create_event and "sender: ''" in line:
        if not sender_seen:
            new_lines.append(line)
            sender_seen = True
        else:
            # Skip duplicate
            pass
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
