import re

file_path = 'components/ContactsView.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Pattern to find the searchableContacts and filteredContacts block
# I need to match the block I just inserted.
pattern = r'const searchableContacts = useMemo\(\(\) => \{[^}]*return contacts\.map\(c => \(\{.*?\}\)\);[^}]*\}, \[contacts\]\);\s*const filteredContacts = useMemo\(\(\) => \{[^}]*return searchableContacts.*?\.map\(item => item\.original\);[^}]*\}, \[searchableContacts, searchTerm\]\);'

replacement = """const searchableContacts = useMemo(() => {
    return contacts.map(c => ({
      original: c,
      lowerName: c.name.toLowerCase(),
      lowerEmail: c.email.toLowerCase(),
      lowerOrg: c.organization.toLowerCase()
    }));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return searchableContacts
      .filter(item =>
        item.lowerName.includes(lowerSearchTerm) ||
        item.lowerEmail.includes(lowerSearchTerm) ||
        item.lowerOrg.includes(lowerSearchTerm)
      )
      .map(item => item.original);
  }, [searchableContacts, searchTerm]);"""

# Use re.DOTALL to match across newlines
new_content, count = re.subn(pattern, replacement, content, flags=re.DOTALL)

if count == 0:
    print("Could not find the pattern to replace.")
else:
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully updated filteredContacts logic to use individual fields.")
