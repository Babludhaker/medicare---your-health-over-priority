# MediCare Connect — Backend

Multi-tenant healthcare appointment & patient-record SaaS. Clinics manage
the full appointment lifecycle and electronic medical records; a platform
super-admin manages all tenants and billing.

**Stack:** Node.js · Express · PostgreSQL · Prisma ORM · Socket.IO
**Integrations:** SendGrid (email) · Twilio (SMS) · Razorpay (payments) · AWS S3 (documents)

---

## 1. Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    edit .env — at minimum set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 3. Generate the Prisma client and create the schema
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed plans + a demo clinic
npm run seed

# 5. Run
npm run dev      # development, auto-reload
npm start        # production
```

The API is served at `http://localhost:4000/api/v1` (health check:
`GET /api/v1/health`).

> **Integration keys are optional in development.** If Razorpay / SendGrid /
> Twilio / AWS keys are left empty, those services run in a safe **mock mode**
> — emails and SMS are logged instead of sent, and payments are auto-simulated.
> Leave the Razorpay keys blank until you have real test keys.

---

## 2. Seed accounts

`npm run seed` creates (demo password for all: `ChangeMe123!`):

| Role          | Email                       |
| ------------- | --------------------------- |
| Super admin   | `superadmin@medicare.test`  |
| Clinic admin  | `admin@democlinic.test`     |
| Doctor        | `doctor@democlinic.test`    |
| Receptionist  | `reception@democlinic.test` |
| Patient       | `patient@democlinic.test`   |

Three subscription plans (Basic / Pro / Enterprise) are also created.

---

## 3. Architecture

```
src/
  config/      env validation, Prisma client, logger
  middleware/  auth, RBAC, tenant scoping, validation, errors, rate limiting
  utils/       errors, responses, tokens, passwords, datetime, audit
  services/    email, sms, payment, storage, pdf, socket, notification
  jobs/        cron: hold expiry, reminders, nightly analytics
  modules/     feature modules — each: routes / controller / service / validation
  app.js       Express assembly
  server.js    HTTP + Socket.IO bootstrap
  routes.js    central API router
```

**Request flow:** `route` (paths + middleware) → `controller` (HTTP shape)
→ `service` (business logic + Prisma) → database. Controllers never contain
business logic; services never touch `req`/`res`.

**Multi-tenancy:** every clinic-scoped row carries a `clinicId`. The
`tenantScope` middleware derives `req.tenantId` from the authenticated user
so a clinic can only ever read or write its own data. The super-admin
operates above tenants.

---

## 4. The scheduling engine

Preventing double-booking is the core challenge. Defence in depth:

1. **Database unique constraint** on `(doctorId, startTime)` — the ultimate
   guarantee. Concurrent inserts: the DB rejects the loser.
2. **Serializable transactions** around hold / reschedule isolate the
   read-then-write.
3. **HOLD status + `holdExpiresAt`** — a slot is locked for `SLOT_HOLD_MINUTES`
   while the patient pays; a cron job releases expired holds.

Slot lifecycle: `HOLD → CONFIRMED → COMPLETED`, with `CANCELLED` / `NO_SHOW`
freeing the slot. `HOLD`, `CONFIRMED`, and `COMPLETED` occupy a slot.

---

## 5. API reference

All routes are prefixed with `/api/v1`. Authenticated routes need an
`Authorization: Bearer <accessToken>` header. Responses use a consistent
envelope: `{ success, data, meta? }` or `{ success, error }`.

### Auth — `/auth`
| Method | Path               | Access  |
| ------ | ------------------ | ------- |
| POST   | `/register`        | public  |
| POST   | `/login`           | public  |
| POST   | `/verify-otp`      | public  |
| POST   | `/refresh`         | public  |
| POST   | `/logout`          | public  |
| POST   | `/verify-email`    | public  |
| POST   | `/forgot-password` | public  |
| POST   | `/reset-password`  | public  |
| GET    | `/me`              | any     |

### Clinics — `/clinics` (super-admin only)
`POST /` · `GET /` · `GET /:clinicId` · `PATCH /:clinicId` · `DELETE /:clinicId`

### Staff — `/users` (clinic-admin, tenant-scoped)
`POST /` · `GET /` · `GET /:userId` · `PATCH /:userId` · `DELETE /:userId`

### Doctors — `/doctors` (tenant-scoped)
| Method | Path                                    | Access            |
| ------ | --------------------------------------- | ----------------- |
| GET    | `/`                                     | any clinic user   |
| GET    | `/:doctorId`                            | any clinic user   |
| GET    | `/:doctorId/slots?date=`                | any clinic user   |
| PATCH  | `/:doctorId`                            | clinic-admin      |
| PUT    | `/:doctorId/availability`               | admin / doctor    |
| POST   | `/:doctorId/blocked-dates`              | admin / doctor    |
| DELETE | `/:doctorId/blocked-dates/:id`          | admin / doctor    |

### Departments — `/departments` (tenant-scoped)
`GET /` (any) · `POST /` (admin) · `DELETE /:departmentId` (admin)

### Patients — `/patients` (tenant-scoped)
`POST /` (reception/admin) · `GET /` (staff) · `GET /:patientId` ·
`PATCH /:patientId` · `GET /:patientId/history` (doctor/patient)

### Appointments — `/appointments` (tenant-scoped)
| Method | Path                          | Access               |
| ------ | ----------------------------- | -------------------- |
| GET    | `/`                           | any (self-scoped)    |
| GET    | `/:appointmentId`             | any (self-scoped)    |
| POST   | `/hold`                       | patient / reception  |
| POST   | `/:appointmentId/confirm`     | patient / reception  |
| PATCH  | `/:appointmentId/reschedule`  | patient / reception  |
| PATCH  | `/:appointmentId/cancel`      | patient / reception  |
| PATCH  | `/:appointmentId/complete`    | doctor / reception   |
| PATCH  | `/:appointmentId/no-show`     | doctor / reception   |
| POST   | `/walk-in`                    | reception            |

### Records (EMR) — `/records` (tenant-scoped)
| Method | Path                                  | Access            |
| ------ | ------------------------------------- | ----------------- |
| POST   | `/:appointmentId`                     | treating doctor   |
| GET    | `/:appointmentId`                     | doctor / patient  |
| POST   | `/:appointmentId/upload-url`          | treating doctor   |
| POST   | `/:appointmentId/prescription`        | treating doctor   |
| GET    | `/:appointmentId/prescription`        | doctor / patient  |

### Payments — `/payments` (tenant-scoped)
| Method | Path                     | Access                        |
| ------ | ------------------------ | ----------------------------- |
| POST   | `/webhook`               | Razorpay (signature-verified) |
| POST   | `/order`                 | patient / reception           |
| POST   | `/verify`                | patient / reception           |
| POST   | `/:paymentId/refund`     | admin / reception             |
| GET    | `/:paymentId`            | admin / reception / patient   |

### Subscriptions — `/subscriptions`
| Method | Path         | Access                        |
| ------ | ------------ | ----------------------------- |
| POST   | `/webhook`   | Razorpay (signature-verified) |
| GET    | `/plans`     | any                           |
| POST   | `/plans`     | super-admin                   |
| POST   | `/subscribe` | clinic-admin (tenant-scoped)  |
| GET    | `/me`        | clinic-admin (tenant-scoped)  |

### Notifications — `/notifications` (self-scoped)
`GET /` · `GET /unread-count` · `PATCH /read-all` · `PATCH /:id/read`

### Analytics — `/analytics`
| Method | Path               | Access       |
| ------ | ------------------ | ------------ |
| GET    | `/clinic`          | clinic-admin |
| GET    | `/clinic/export`   | clinic-admin |
| GET    | `/platform`        | super-admin  |

---

## 6. Real-time (Socket.IO)

Clients connect with their access token. Server emits:
`notification:new` to a user's room when a notification is created
(appointment confirmed/cancelled, payment received, etc.).

---

## 7. Background jobs

| Job              | Schedule  | Purpose                                  |
| ---------------- | --------- | ---------------------------------------- |
| Hold expiry      | every min | release expired `HOLD` slots             |
| Reminders        | hourly    | 24h / 2h appointment reminders           |
| Analytics rollup | nightly   | pre-compute dashboard aggregates         |

---

## 8. Notes

- Passwords hashed with `bcryptjs`. Access tokens are short-lived JWTs;
  refresh tokens are stored hashed and rotated on every use.
- Account lockout after repeated failed logins; optional TOTP-style OTP 2FA.
- Every sensitive action writes an `AuditLog` row.
- Soft-deletes only (`isActive` flags) — history is never destroyed.
