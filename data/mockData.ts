import { Contact, EventData, Priority } from '../types';
export const MOCK_CONTACTS: Contact[] = [
  { id: 'c20', name: 'Alessandro Di Miceli', email: 'alessandro@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: VET and Apprenticeships' },
  { id: 'c21', name: 'Elodie Böhling', email: 'elodie@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Democracy and Student Rights' },
  { id: 'c22', name: 'Ívar Máni Hrannarsson', email: 'ivar@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Social Affairs' },
  { id: 'c23', name: 'Kacper Bogalecki', email: 'kacper@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Organisational Development' },
  { id: 'c24', name: 'Lauren Bond', email: 'lauren@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Education Policy' },
  { id: 'c25', name: 'Rui Teixeira', email: 'rui@obessu.org', role: 'Secretary General', organization: 'OBESSU', notes: 'Overall management and external representation' },
  { id: 'c26', name: 'Raquel Moreno Beneit', email: 'raquel@obessu.org', role: 'Communications Coordinator', organization: 'OBESSU', notes: 'Campaigns and Digital Presence' },
  { id: 'c27', name: 'Panagiotis Chatzimichail', email: 'panagiotis@obessu.org', role: 'Head of External Affairs', organization: 'OBESSU', notes: 'Lead on LLL Labs and Erasmus+ Projects' },
  { id: 'c28', name: 'Amira Bakr', email: 'amira@obessu.org', role: 'Policy and Outreach Assistant', organization: 'OBESSU', notes: 'Policy monitoring' },
  { id: 'c29', name: 'Francesca Osima', email: 'francesca@obessu.org', role: 'Head of Projects and Operations', organization: 'OBESSU', notes: 'Project management' },
  { id: 'c30', name: 'Daniele Sabato', email: 'daniele@obessu.org', role: 'Project & Policy Coordinator', organization: 'OBESSU', notes: 'VET Strategy' }
];

export const MOCK_EVENTS: EventData[] = [
  {
    id: 'e1',
    createdAt: Date.now(),
    originalText: 'Solidar Webinar invitation',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Solidar',
      eventName: 'Solidar Webinar: Advocacy Campaigning',
      theme: 'School Student Rights & Democracy',
      description: 'Planning a session on how to plan, implement, monitor, evaluate an Advocacy Campaign. OBESSU expertise is requested for this topic.',
      priority: Priority.High,
      priorityScore: 85,
      priorityReasoning: 'Strategic partnership with Solidar on advocacy capacity building.',
      date: '2026-02-10',
      venue: 'Online (Zoom)',
      initialDeadline: '2026-02-05',
      finalDeadline: '2026-02-09',
      linkedActivities: ['Advocacy Handbook', 'Capacity Building Workplan'],
    },
    contact: {
        contactId: 'c27',
        name: 'Panagiotis Chatzimichail',
        email: 'panagiotis@obessu.org',
        role: 'Head of External Affairs',
        organization: 'OBESSU',
        repRole: 'Speaker',
        polContact: 'Rui Teixeira',
        notes: ''
    },
    followUp: {
      briefing: 'Focus on OBESSU’s recent successful campaigns on student participation.',
      prepResources: '',
      commsPack: { remarks: '', representative: 'Panagiotis', datePlace: 'Feb 10, Online', additionalInfo: '' },
      postEventNotes: '',
      status: 'To Respond'
    }
  },
  {
    id: 'e2',
    createdAt: Date.now(),
    originalText: 'R2P Webinar content',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Research to Policy (R2P)',
      eventName: 'R2P: Smartphone & Social Media Restrictions impact',
      theme: 'Digital Education & AI',
      description: 'Webinar discussing the impact of smartphones and social media restrictions on education based on evidence from schools in Europe.',
      priority: Priority.Medium,
      priorityScore: 70,
      priorityReasoning: 'Relevant for OBESSU’s digital education positions and student well-being.',
      date: '2026-02-12',
      venue: 'Online',
      initialDeadline: '2026-02-10',
      finalDeadline: '2026-02-11',
      linkedActivities: ['Digital Education Position Paper'],
    },
    contact: {
        contactId: 'c21',
        name: 'Elodie Böhling',
        email: 'elodie@obessu.org',
        role: 'Board Member',
        organization: 'OBESSU',
        repRole: 'Participant',
        polContact: 'Panagiotis',
        notes: ''
    },
    followUp: {
      briefing: '',
      prepResources: '',
      commsPack: { remarks: '', representative: 'Elodie', datePlace: 'Feb 12, Online', additionalInfo: '' },
      postEventNotes: '',
      status: 'Confirmation - To be briefed'
    }
  },
  {
    id: 'e3',
    createdAt: Date.now(),
    originalText: 'LLL Labs 2026 Kick-off',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Lifelong Learning Platform',
      eventName: 'Lifelong Learning Labs 2026 (Kick-off)',
      theme: 'Inclusive Education & Social Justice',
      description: 'The sixth edition featuring four distinct online training courses for national stakeholders in education and training.',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Long-term core project with LLLP, essential for membership engagement.',
      date: '2026-02-19',
      venue: 'Online',
      initialDeadline: '2026-02-15',
      finalDeadline: '2026-02-18',
      linkedActivities: ['LLL Labs 2026 Series'],
      registrationLink: 'https://us06web.zoom.us/j/83728709029',
      programmeLink: 'https://docs.google.com/document/d/1dRAGmqrVwBpmVZfeIaob3gVmRqVpSewZ'
    },
    contact: {
        contactId: 'c27',
        name: 'Panagiotis Chatzimichail',
        email: 'panagiotis@obessu.org',
        role: 'Head of External Affairs',
        organization: 'OBESSU',
        repRole: 'Activity Host',
        polContact: 'Rui Teixeira',
        notes: ''
    },
    followUp: {
      briefing: 'Coordinate with trainers for the first lab session.',
      prepResources: 'Shared Google Doc for Lab 1 agenda.',
      commsPack: { remarks: '', representative: 'Panagiotis', datePlace: 'Feb 19, Online', additionalInfo: '' },
      postEventNotes: '',
      status: 'Confirmation - To be briefed'
    }
  },
  {
    id: 'e4',
    createdAt: Date.now(),
    originalText: 'VET Strategy Consultation',
    analysis: {
      sender: 'Daniele Sabato',
      institution: 'European Commission (DG EMPL)',
      eventName: 'VET Strategy Consultation: Quality & Future-readiness',
      theme: 'Vocational Education & Training (VET)',
      description: 'Online consultation session on VET strategy focusing on quality and future-readiness. Guests include Amira Bakr and Daniele Sabato.',
      priority: Priority.High,
      priorityScore: 92,
      priorityReasoning: 'Direct influence on the upcoming EU VET Strategy review.',
      date: '2026-02-23',
      venue: 'Online (Paris/Brussels Time)',
      initialDeadline: '2026-02-15',
      finalDeadline: '2026-02-20',
      linkedActivities: ['VET Advocacy Campaign', 'Apprenticeship Rights Paper'],
    },
    contact: {
        contactId: 'c20',
        name: 'Alessandro Di Miceli',
        email: 'alessandro@obessu.org',
        role: 'Board Member',
        organization: 'OBESSU',
        repRole: 'Participant',
        polContact: 'Daniele Sabato',
        notes: ''
    },
    followUp: {
      briefing: 'Advocate for better protection of apprentices and quality in VET education.',
      prepResources: '',
      commsPack: { remarks: '', representative: 'Alessandro', datePlace: 'Feb 23, Online', additionalInfo: '' },
      postEventNotes: '',
      status: 'To Respond'
    }
  },
  {
    id: 'e5',
    createdAt: Date.now(),
    originalText: 'LLLAB #2',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Lifelong Learning Platform',
      eventName: 'LLLAB #2: Social European Semester',
      theme: 'School Student Rights & Democracy',
      description: 'Lab session on Engaging nationally in the European Semester and strengthening lifelong learning within it.',
      priority: Priority.High,
      priorityScore: 88,
      priorityReasoning: 'Focus on national engagement and the European Semester is critical for OBESSU MOs.',
      date: '2026-02-26',
      venue: 'Online',
      initialDeadline: '2026-02-20',
      finalDeadline: '2026-02-24',
      linkedActivities: ['LLL Labs 2026 Series', 'European Semester Working Group'],
      programmeLink: 'https://docs.google.com/document/d/1StEDQTbQwb8r93ILjwljNGNRmGdAxOT-'
    },
    contact: {
        contactId: 'c30',
        name: 'Daniele Sabato',
        email: 'daniele@obessu.org',
        role: 'Project & Policy Coordinator',
        organization: 'OBESSU',
        repRole: 'Speaker',
        polContact: 'Panagiotis',
        notes: ''
    },
    followUp: {
      briefing: 'Present OBESSU views on how the European Semester can better include school student voices.',
      prepResources: '',
      commsPack: { remarks: '', representative: 'Daniele', datePlace: 'Feb 26, Online', additionalInfo: '' },
      postEventNotes: '',
      status: 'To Respond'
    }
  }
];
