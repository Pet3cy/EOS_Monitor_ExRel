import sys

# 1. Fix EventDetail.tsx
with open('components/EventDetail.tsx', 'r') as f:
    content = f.read()

# Define handleCreateContact
# It should be placed before return or inside the component body.
# Let's verify where to insert it.
# We can insert it before "const handleSave = (e: React.FormEvent) => {" if that exists,
# or just before "return ("

# There is "const [showNewContactModal, setShowNewContactModal] = useState(false);"
# Let's put it after that.

if "const handleCreateContact =" not in content:
    insertion_point = "const [showNewContactModal, setShowNewContactModal] = useState(false);"
    new_code = """const [showNewContactModal, setShowNewContactModal] = useState(false);

  const handleCreateContact = (contact: Contact) => {
    if (onAddContact) {
        onAddContact(contact);
    }
    setShowNewContactModal(false);
  };"""
    if insertion_point in content:
        content = content.replace(insertion_point, new_code)
        with open('components/EventDetail.tsx', 'w') as f:
            f.write(content)
        print("Fixed EventDetail.tsx")
    else:
        print("Could not find insertion point in EventDetail.tsx")

# 2. Fix Overview.tsx
with open('components/Overview.tsx', 'r') as f:
    content = f.read()

if "aggregateStakeholders" in content and "import { aggregateStakeholders }" not in content:
    # Add import
    # Look for the last import line
    import_line = "import { Building2, FileText, CheckCircle2, Layers, Edit2, Check, X } from 'lucide-react';"
    if import_line in content:
        new_import = import_line + "\nimport { aggregateStakeholders } from '../services/stakeholderUtils';"
        content = content.replace(import_line, new_import)
        with open('components/Overview.tsx', 'w') as f:
            f.write(content)
        print("Fixed Overview.tsx")
    else:
        print("Could not find import line in Overview.tsx")
