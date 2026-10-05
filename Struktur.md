Phase 1: Foundation

- New repo with a proper name, GitHub Issues and a Project board, branches and pull requests from day one. Archive Handlingslista. (GitHub)

- Supabase project with tables for households, members, shopping items, events, todos and medicine logs. Design the relations properly, since this is your SQL showcase. (Supabase Free)
- Google login with Supabase Auth, and Row Level Security so members only see their own household's data. (Supabase Free)

Phase 2: The app
4. Rebuild in React + TypeScript with Vite, split into modules. Reads and writes go directly to Supabase with realtime sync, so the app is always fast even when the backend sleeps.
5. Features: shopping list (with checkboxes), calendar (with empty state), to-dos, and the medicine tab merged from the Alvedon app.
6. Migrate your existing data from Firebase, then shut the Firebase project down.
7. Demo household with sample data and a "Try demo" button, fully separated from your real data by RLS.
8. Swedish and English language toggle.
9. Accessibility: contrast, labels, keyboard navigation. Lighthouse scores in the README.

Phase 3: Backend and security
10. Express backend in TypeScript with StudyPal-level security: helmet, rate limiting, input validation, and verifying the Supabase token on every request. Handles medicine dose validation and push notifications.
11. Push notifications with the web-push library and VAPID keys, no paid service needed. On iPhone it requires the app to be added to the home screen.

Phase 4: Quality and DevOps
12. Tests: Jest and Supertest for the backend, Vitest and React Testing Library for the frontend, and a couple of Playwright end-to-end tests.
13. GitHub Actions: lint and tests on every push, deploy on merge to main, and a scheduled job that resets the demo household (which also keeps Supabase active). (Free for public repos)
14. Docker Compose with Caddy as reverse proxy, running locally and documented.
15. Deploy: frontend on Vercel or Netlify, backend on Render's free tier. (Free)
16. Error tracking with Sentry's free tier.

Phase 5: Presentation
17. README with screenshots, a live demo link, architecture diagram, trade-offs ("why Supabase, why reads skip the backend, why Caddy"), a privacy/GDPR section about the medicine data, and test and Lighthouse results.
18. Resume line with real numbers, like how long and how often the app has been used.