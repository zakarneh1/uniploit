# UniPilot

UniPilot is a full-stack academic planning web application for university students. It helps users organize semesters, manage courses, track grades, and monitor GPA progress in one workspace.

## Highlights

- Email and Google-based authentication
- Semester and session planning
- Course and grade tracking
- GPA calculation and progress analytics
- Responsive dashboard built with modern React patterns

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- State + Data: Zustand, TanStack Query
- Backend API: Node.js serverless functions in [api/](api/)
- Database: PostgreSQL

## Project Structure

- [src/](src/): React frontend
- [api/](api/): serverless API handlers
- [database_schema.sql](database_schema.sql): relational schema
- [public/](public/): static assets

## Environment Variables

Create a local `.env` file with the following keys:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=replace_with_a_strong_random_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Getting Started

```bash
pnpm install
pnpm run dev
```

The app will run on the local Vite development server.

## Available Scripts

```bash
pnpm run dev      # Start dev server
pnpm run build    # Create production build
pnpm run preview  # Preview production build locally
pnpm run lint     # Run ESLint
```

## Deployment Notes

- Frontend build output is generated via Vite.
- API routes are implemented under [api/](api/) and can be deployed to serverless platforms that support Node.js handlers.
- Ensure production secrets are configured in your deployment environment.

## Why This Project

This project demonstrates practical full-stack engineering skills:

- Designing and consuming REST-style APIs
- Building maintainable React UI with reusable components
- Managing state and async data flows in production-style code
- Working with relational data models and authenticated user flows

## License

This repository is available for portfolio and evaluation purposes.
