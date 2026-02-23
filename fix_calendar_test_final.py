with open("utils/calendarUtils.test.ts", "r") as f:
    content = f.read()

content = content.replace("    sender: '',\n    sender: '',", "    sender: '',")

with open("utils/calendarUtils.test.ts", "w") as f:
    f.write(content)
