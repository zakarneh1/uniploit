export const GRADE_COLORS = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#EF4444',
  F: '#991B1B',
};

export const PRIORITY_COLORS = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#EF4444',
};

export const COURSE_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#EC4899',
  '#14B8A6',
];

export const KEYBOARD_SHORTCUTS = [
  { key: '/', description: 'Open command palette' },
  { key: 'n', description: 'Add new course' },
  { key: 'g', description: 'Open GPA calculator' },
  { key: 't', description: 'Toggle theme' },
  { key: 'p', description: 'Go to planner' },
  { key: 'd', description: 'Go to dashboard' },
  { key: 'c', description: 'Go to courses' },
  { key: 'a', description: 'Go to analytics' },
];

export const FAQ_ITEMS = [
  {
    question: 'How does UniPilot calculate my GPA?',
    answer:
      'UniPilot uses your course grades, credit hours, and your institution\'s GPA scale to calculate both current and predicted GPA. We factor in completed assessments and their weights to project your final grades.',
  },
  {
    question: 'Can I use UniPilot for multiple semesters?',
    answer:
      'Yes! UniPilot supports tracking courses across multiple semesters. You can archive completed courses and view historical data in the analytics section.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. All your academic data is encrypted and stored securely. We never share your information with third parties.',
  },
  {
    question: 'Why do I need to sign in?',
    answer:
      'Signing in allows us to save your semester, grades, and planner securely in the cloud. This means you can access your data from any device and never lose your progress.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'Yes, you can export your grades, GPA reports, and study schedules as PDF or CSV files from the Analytics page.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Major',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content:
      'UniPilot helped me raise my GPA from 3.2 to 3.8 in one semester. The grade tracking is incredibly helpful!',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Engineering Student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content:
      'The grade calculator feature is a game-changer. I always know exactly what I need to score on finals.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Biology Major',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content:
      'Love the study planner! It keeps me organized and helps me stay on track with all my courses.',
    rating: 5,
  },
];