import re

with open('components/ContactsView.tsx', 'r') as f:
    content = f.read()

target_block = """  const searchableContacts = useMemo(() => {"""
replacement_block = """  // Optimization: Pre-calculate lowercased fields to avoid repeated toLowerCase() calls during filter operations.
  const searchableContacts = useMemo(() => {"""

if target_block in content:
    content = content.replace(target_block, replacement_block, 1) # Only once
    print("Successfully added optimization comment.")
else:
    print("Could not find searchableContacts block.")

with open('components/ContactsView.tsx', 'w') as f:
    f.write(content)
