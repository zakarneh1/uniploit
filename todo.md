# UniPilot – AI University Planner & GPA Tracker

## Design Guidelines

### Design References
- **Linear.app**: Clean, modern SaaS UI with subtle animations
- **Notion.com**: Card-based layouts, smooth interactions
- **Vercel Dashboard**: Dark mode excellence, gradient accents
- **Style**: Modern SaaS + Glassmorphism + Gradient Accents

### Color Palette
- Primary: #6366F1 (Indigo - main brand)
- Secondary: #8B5CF6 (Purple - accents)
- Success: #10B981 (Green - positive states)
- Warning: #F59E0B (Amber - alerts)
- Danger: #EF4444 (Red - errors)
- Background Light: #FFFFFF
- Background Dark: #0F172A (Slate 900)
- Surface Light: #F8FAFC (Slate 50)
- Surface Dark: #1E293B (Slate 800)

### Typography
- Heading1: Inter font-weight 700 (36px)
- Heading2: Inter font-weight 600 (28px)
- Heading3: Inter font-weight 600 (20px)
- Body: Inter font-weight 400 (14px)
- Body Bold: Inter font-weight 600 (14px)
- Small: Inter font-weight 400 (12px)

### Key Component Styles
- **Cards**: Glass effect with backdrop-blur, subtle border, rounded-xl
- **Buttons**: Gradient backgrounds on primary, smooth hover transitions
- **Inputs**: Focused ring effect, smooth transitions
- **Shadows**: Layered shadows for depth (sm, md, lg, xl)
- **Animations**: Framer Motion for page transitions, hover effects, loading states

### Layout & Spacing
- Sidebar: 280px desktop, collapsible to 80px, drawer on mobile
- Content padding: 24px desktop, 16px mobile
- Card spacing: 16px gaps in grids
- Section spacing: 48px vertical between major sections

### Images to Generate
1. **hero-gradient-mesh.jpg** - Abstract gradient mesh background for hero section (Style: abstract, vibrant gradients, purple/indigo tones)
2. **dashboard-illustration.png** - Modern illustration of student planning (Style: minimalist, flat design, purple accent)
3. **analytics-chart-bg.jpg** - Subtle background pattern for analytics section (Style: geometric, subtle, light)
4. **ai-coach-avatar.png** - Friendly AI assistant avatar icon (Style: modern, friendly, robot/AI themed)
5. **feature-calendar.png** - Calendar/planner feature illustration (Style: clean, modern UI mockup)
6. **feature-grades.png** - Grades tracking feature illustration (Style: clean, modern UI mockup)

---

## Project Structure

### Core Setup
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui components
- React Router v6
- Zustand for state management
- React Hook Form + Zod validation
- TanStack Table v8
- Recharts for data visualization
- Framer Motion for animations
- Sonner for toast notifications
- lucide-react for icons

### Folder Structure
```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── layout/          # AppShell, Sidebar, TopBar
│   ├── dashboard/       # Dashboard widgets
│   ├── courses/         # Course components
│   ├── planner/         # Planner components
│   ├── coach/           # AI Coach components
│   ├── analytics/       # Analytics components
│   └── shared/          # Shared components
├── pages/
│   ├── Landing.tsx
│   ├── auth/
│   ├── app/
│   │   ├── Dashboard.tsx
│   │   ├── Courses.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── Planner.tsx
│   │   ├── Coach.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── NotFound.tsx
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCourses.ts
│   ├── useTheme.ts
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── api.ts           # Mock API functions
│   ├── utils.ts
│   └── constants.ts
├── store/
│   ├── authStore.ts
│   ├── courseStore.ts
│   ├── plannerStore.ts
│   └── uiStore.ts
├── data/
│   └── mockData.ts      # Sample data
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

## Development Tasks

1. **Setup & Dependencies** - Initialize project, install all required packages
2. **Generate Images** - Create all 6 images using ImageCreator
3. **Core Infrastructure** - Setup routing, stores, theme provider, mock API
4. **UI Components** - Build reusable components (cards, modals, forms, tables)
5. **Layout System** - AppShell, Sidebar, TopBar with responsive behavior
6. **Landing Page** - Hero, features, testimonials, FAQ with animations
7. **Auth Pages** - Login/Signup with validation and split layout
8. **Dashboard** - KPI cards, charts, activity feed, widgets
9. **Courses Pages** - Table view, grid view, course detail with tabs
10. **Planner Page** - Calendar grid, session management, drag-drop
11. **AI Coach Page** - Chat UI, message streaming, wizard stepper
12. **Analytics Page** - Multiple charts, filters, date range picker
13. **Settings Page** - Profile, preferences, theme toggle, danger zone
14. **Global Features** - Command palette, keyboard shortcuts, notifications
15. **Polish & Animations** - Micro-interactions, skeleton loaders, error states
16. **Testing & Lint** - Final checks and build verification