import sys

with open('components/EventDetail.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

# The first one is around line 57
#   const handleCreateContact = (contact: Contact) => {
#     if (onAddContact) {
#       onAddContact(contact);
#     }
#     setShowNewContactModal(false);
#   };

# The second one is around line 80
#   const handleCreateContact = (newContact: Contact) => {
#     if (onAddContact) {
#       onAddContact(newContact);
#     }
#     handlePickContact(newContact);
#     setShowNewContactModal(false);
#   };

# We want to keep the second one because it calls `handlePickContact`.

for line in lines:
    if "const handleCreateContact = (contact: Contact) => {" in line:
        skip = True
        continue

    if skip:
        if "};" in line:
            skip = False
            continue
        continue

    new_lines.append(line)

with open('components/EventDetail.tsx', 'w') as f:
    f.writelines(new_lines)

print("Removed first handleCreateContact")
