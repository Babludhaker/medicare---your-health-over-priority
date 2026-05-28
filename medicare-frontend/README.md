# MediCare Connect — Frontend

The web frontend for **MediCare Connect**, a multi-tenant healthcare
appointment & patient-records SaaS. It pairs with the Node/Express/Prisma
backend (`medicare-backend`).

Built with **React + Vite**, **Tailwind CSS**, **Zustand**, and
**React Router**.

---

## What's included

This is the **complete application** — the public marketing site, the
full authentication flow, and the dashboards for all five roles.

**Public marketing site**
- Landing, About, Contact (with form), Pricing, Find a Doctor, 404
- Pricing pulls live plans from the API, with a static fallback

**Authentication**
- Login (with two-factor / OTP branch), Register (patient self-signup)
- Verify OTP, Forgot Password, Reset Password, Verify Email

**Role dashboards**
- **Super Admin** — platform overview, clinics CRUD, subscription
  plans, platform analytics
- **Clinic Admin** — clinic overview, staff, departments, doctors +
  weekly availability, appointments, billing/subscription, analytics
  with CSV export
- **Doctor** — daily schedule, EMR records & e-prescriptions, patient
  directory
- **Receptionist** — front desk, appointment booking, walk-in
  registration, patient registry
- **Patient** — appointments (upcoming/past), book-a-visit flow,
  health record with visit notes & prescriptions

---

## Tech stack

| Concern        | Choice                          |
|----------------|---------------------------------|
| Build tool     | Vite 5                          |
| UI library     | React 18                        |
| Routing        | React Router 6 (data router)    |
| State          | Zustand 5 (session/UI)          |
| Server state   | TanStack Query 5                |
| Styling        | Tailwind CSS 3                  |
| Forms          | React Hook Form                 |
| HTTP           | Axios                           |
| Animation      | Framer Motion                   |
| Icons          | Lucide React                    |

Routes are **code-split** — the public site, auth flow, and each
dashboard load as separate chunks on first visit.

---

## Getting started

### Prerequisites
- Node.js 18+ and npm
- The `medicare-backend` running locally (default `http://localhost:4000`)

### Install & run

```bash
npm install
npm run dev
```

The app starts on `http://localhost:5173`. In development, Vite proxies
`/api` to the backend, so no CORS setup is needed.

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## Environment variables

Copy `.env.example` to `.env`:

- `VITE_API_URL` — API base URL. Leave unset in dev (the proxy handles
  it). In production set it to your deployed API, e.g.
  `https://api.medicareconnect.app/api/v1`.
- `VITE_PROXY_TARGET` — backend origin for the dev proxy
  (default `http://localhost:4000`).

---

## Trying it out

Start the backend, seed it (`npm run seed` in the backend), then sign in
with a seed account — all use password `ChangeMe123!`:

| Email                       | Role         | Lands on        |
|-----------------------------|--------------|-----------------|
| superadmin@medicare.test    | Super Admin  | /app/platform   |
| admin@democlinic.test       | Clinic Admin | /app/clinic     |
| doctor@democlinic.test      | Doctor       | /app/schedule   |
| reception@democlinic.test   | Receptionist | /app/front-desk |
| patient@democlinic.test     | Patient      | /app/appointments |

---

## Project structure

```
src/
  api/          Axios client + per-module API services
  components/
    ui/         Reusable UI kit — Button, Input, Card, Modal, Toast,
                DataTable, Pagination, Charts, ConfirmDialog, …
    layout/     Navbar, Footer, Sidebar, Topbar, Logo
  features/
    public/     Public-site building blocks
    appointments/  AppointmentsTable + the BookingFlow wizard
  hooks/        useAuth, useResource / useMutation (React Query), useConfirm
  layouts/      PublicLayout, AuthLayout, AppLayout
  lib/          Constants, utility + date helpers
  pages/
    auth/       Login, register, OTP, password, email verification
    app/
      superadmin/   Platform overview, clinics, plans, analytics
      clinicadmin/  Overview, staff, departments, doctors, billing,
                    analytics
      doctor/       Schedule, records (EMR)
      receptionist/ Front desk
      patient/      Appointments, booking, health record
      shared/       Appointments, patients, notifications (multi-role)
  router/       Route tree (code-split), guards, sidebar nav config
  store/        Zustand stores (auth, ui)
  styles/       Global stylesheet + Tailwind layers
```

### Key architectural notes

- **API client** (`src/api/client.js`) unwraps the backend's
  `{ success, data }` envelope and transparently refreshes an expired
  access token on a `401`, queuing concurrent requests during refresh.
  If refresh fails it triggers a clean logout.
- **Auth store** (`src/store/auth.store.js`) is the single source of
  truth for the session, persists to `localStorage`, handles the 2FA
  login branch, and re-validates on app start via `bootstrap()`.
- **Data fetching** uses **TanStack Query** (React Query) for server
  state — caching, background refetch, request dedup. Two thin
  adapters keep call sites consistent: `useResource` (a cached read,
  wrapping `useQuery`) and `useMutation` (a write with an `invalidate`
  option listing the query keys to refresh on success). Cache keys are
  defined centrally in `src/lib/queryKeys.js`; the client is
  configured in `src/lib/queryClient.js`. The React Query Devtools
  panel is available in development.
- **Route guards** (`src/router/guards.jsx`) — `ProtectedRoute` gates
  on authentication, `RoleRoute` gates on role, `GuestOnlyRoute` keeps
  signed-in users out of the auth pages.
- **Booking flow** (`src/features/appointments/BookingFlow.jsx`) uses
  the backend's transaction-safe two-phase `hold` → `confirm` booking,
  which prevents double-booking under concurrency.

### Notes

- The Contact form is simulated locally (the backend has no public
  contact endpoint) — wire it to an email service when one exists.
- Analytics screens read defensively, tolerating variation in the
  analytics payload shape, and degrade gracefully if the analytics
  service is unavailable.
