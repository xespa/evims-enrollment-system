# EVIMS Enrollment System

The school website and online enrollment system of Eastern Visayas International Montessori School (EVIMS), Borongan City. Families apply and pay online, staff review applications and collect fees, teachers keep grade sheets, and students check their grades.

It has four parts:

| Part | Who uses it | What they do |
|------|-------------|--------------|
| **Public website** | Everyone | Home, about, academics, student services, events, contact |
| **Parent portal** (`/portal`) | Parents / guardians | Apply for admission, upload documents, pay tuition by GCash, track applications |
| **Student portal** (`/student`) | Students | Sign in with their LRN, view and download their grade report |
| **Admin panel** (`/admin`) | School staff | Review applications, record payments, set up school years, keep grade sheets |

## Tech stack

| Layer    | Tools |
|----------|-------|
| Backend  | PHP 8.4, Laravel 13, Laravel Fortify |
| Frontend | React 19, Inertia.js v3, TypeScript, Tailwind CSS v4, Vite |
| Routing  | Laravel Wayfinder, Ziggy (`route()` in React) |
| Payments | PayMongo (GCash checkout and webhooks) |
| Database | MySQL; database driver for queues, cache and sessions |
| Quality  | Pest 4, Larastan (PHPStan), Pint, ESLint, Prettier |

## Requirements

- PHP 8.4 and Composer
- Node.js 22+ and npm
- MySQL
- A PayMongo account for real online payments (optional locally, see [sandbox mode](#paymongo--gcash))

## Getting started

```bash
git clone <repo-url> evims-enrollment-system
cd evims-enrollment-system

composer setup        # installs dependencies, creates .env, generates the key, migrates, builds assets
php artisan db:seed   # staff accounts, grade levels, fees and subjects
composer run dev      # server, queue worker, logs and Vite together
```

Open `http://localhost:8000`. Everyone signs in at `/login`.

### Seeded staff accounts

Every account uses the password `password`.

| Role | Email |
|------|-------|
| Administrator | `admin@example.com` |
| Registrar | `registrar@example.com` |
| Teacher | `teacher@example.com` |
| Cashier | `cashier@example.com`, `test@example.com` |

Administrators and registrars must set up two-factor authentication on first sign-in, so have an authenticator app ready. It's optional for the other roles.

Parent and student accounts aren't seeded. Create a parent account at `/register`; student accounts are made by staff (see [Accounts and sign-in](#accounts-and-sign-in)).

### Sample data

These seeders aren't part of `db:seed`. Run one with `php artisan db:seed --class=<Name>` when you need data to try a feature:

| Seeder | Adds |
|--------|------|
| `GradeSheetTestSeeder` | Approved students in each grade level that has a grade sheet, taking every subject |
| `AwardsTestSeeder` | A fully graded S.Y. 2025-2026 (five students per section, with student accounts) to try academic awards |
| `NurserySectionSeeder` | Fills Nursery Section A with approved students, each with parent and student accounts |
| `ReturningStudentsSeeder` | Re-applies last year's approved students one grade level up, as pending applications |
| `CounterPaymentTestSeeder` | Ten approved enrollees paying at the counter, some with earlier receipts |

## Configuration

`composer setup` copies `.env.example` to `.env`. Fill in the values below; always read them through `config()`, never `env()`, outside the `config/` files.

### Database

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=evims
DB_USERNAME=root
DB_PASSWORD=
```

### Mail

Needed for email verification, staff invitations, and application, payment and reminder emails.

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-address@gmail.com
MAIL_PASSWORD="your-app-password"
MAIL_FROM_ADDRESS="evims@example.com"
```

Locally, `MAIL_MAILER=log` writes emails to `storage/logs/laravel.log` instead of sending them.

### PayMongo / GCash

```env
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_...
PAYMONGO_SANDBOX_MODE=false

SCHOOL_GCASH_NUMBER=0917-123-4567
SCHOOL_GCASH_NAME="EVIMS School Inc."
```

- **Sandbox mode.** `PAYMONGO_SANDBOX_MODE=true` skips PayMongo and uses a built-in fake checkout page (`/payments/sandbox/{payment}/checkout`), so you can test the whole payment flow without API keys.
- **Webhook.** In PayMongo, point the webhook at `https://<your-domain>/paymongo/webhook`. It must be reachable from the internet, so use a tunnel such as ngrok locally. Signatures are verified with `PAYMONGO_WEBHOOK_SECRET`.
- **Without a verified PayMongo account**, `php artisan payment:simulate-webhook {payment_id}` sends a `source.chargeable` webhook for a payment.

### School

```env
EVIMS_SCHOOL_ID=   # EVIMS's DepEd School ID, prefilled as a returning student's "Previous School ID"
```

## Accounts and sign-in

There's one sign-in page, `/login`, where people choose their role first. The old `/portal/login` and `/student/login` addresses redirect there. Each kind of account has its own table and guard:

| Account | Table | Guard | How it's created |
|---------|-------|-------|------------------|
| Staff | `users` | `web` (Fortify) | Staff sign up at `/register` and wait for an administrator's approval, or are invited from **Staff Accounts** |
| Parent / guardian | `enrollee_users` | `enrollee` | Sign up at `/register`, verify their email, then wait for staff to approve them under **Portal Accounts** |
| Student | `student_accounts` | `student` | Created by staff under **Student Accounts** once a parent consents. Students sign in with their LRN, which is also their first password |

A parent account must be approved before it can view applications, upload documents or pay online.

### Staff roles

| Role | Can |
|------|-----|
| Administrator | Everything, including school year setup and staff accounts |
| Registrar | Review applications and portal accounts, upload documents, record payments |
| Teacher | View students, upload their Form 138 (report card), keep grade sheets |
| Cashier | Record and void counter payments, manage billing and collections |

The admin panel hides pages a role can't use, and policies and gates enforce the same rules on the server (see `app/Enums/UserRole.php`).

## How enrollment works

1. **Sign up.** A parent creates an account at `/register` and verifies their email. Staff approve it under **Portal Accounts**.
2. **Apply.** The parent fills in the admission form at `/admission`: student info, address, parents, academic history, subjects and a billing plan. Returning students are found by their LRN, and their documents carry over. The application starts as `PENDING`.
3. **Upload documents.** The parent uploads the Form 138, birth certificate and good moral certificate from the portal. A returning student's Form 138 comes from the school instead (see [Send grades](#grades-and-report-cards)).
4. **Review.** Staff open the application under **Students**, verify the documents, assign an LRN if needed, place the student in a section, and approve or reject it. The parent gets an email and a portal notification, and approved applications get a registration form PDF.
5. **Pay.** Once approved, the parent pays each installment by GCash. PayMongo's webhook and return URLs mark installments paid. Cashiers record cash payments at the counter and can void them.

### Billing plans

Tuition is split into installments over a 10-month school year:

| Plan           | Installments |
|----------------|--------------|
| `FULL_PAYMENT` | 1            |
| `BI_MONTHLY`   | 5            |
| `MONTHLY`      | 10           |

When an administrator edits a grade level's fees, the unpaid installments of existing enrollments are repriced.

### School years

Under **School Year Setup**, administrators set each school year's enrollment period and every grade level's fees, subjects and sections (A to C by default). Each school year is kept separate, so next year's changes never affect this year's students or bills.

## Grades and report cards

- **Grade sheets.** A teacher keeps one grade sheet per subject. It covers every approved student taking that subject in its grade level and school year, across all sections. Each student gets three term grades; the final grade and Passed/Failed remark are worked out from them.
- **Report cards.** Each student's report card can be opened from the grade sheet, or all of them downloaded as one PDF. Students see theirs in the student portal.
- **Academic awards.** From Grade 4 up, the **Awards** dialog lists each student's recognition, worked out from all of the grade level's sheets.
- **Send grades.** At the end of the year, **Send grades** attaches each student's report card to their next school year's application as its Form 138.
- **Archive.** A finished sheet can be archived. It can't be edited, and its grades stop showing to students until it's restored.

## Background work

- **Queue.** Emails, notifications and other slow work go through the database queue (`QUEUE_CONNECTION=database`). `composer run dev` starts a worker; in production, run `php artisan queue:work` under a process manager such as Supervisor.
- **Scheduler.** `enrollment:send-period-reminders` runs daily at 07:00 to remind families about enrollment periods. Locally, run `php artisan schedule:work`; in production, add the standard cron entry for `php artisan schedule:run`.

## Project structure

```
app/
├── Actions/            # business logic: enrollment, grade sheets, awards, payments
├── Console/Commands/   # enrollment reminders, webhook simulator
├── Enums/              # roles, statuses, billing plans, awards
├── Http/
│   ├── Controllers/
│   │   ├── Admin/      # admin panel
│   │   ├── Portal/     # parent portal
│   │   ├── Student/    # student portal
│   │   └── Api/        # Philippine address lookups
│   └── Requests/       # validation (Form Requests)
├── Mail/               # application status and registration form emails
├── Models/
├── Notifications/      # email and in-app notifications
├── Policies/
└── Services/           # PayMongo integration

resources/js/
├── pages/
│   ├── Site/           # public website
│   ├── Enrollment/     # multi-step admission form
│   ├── Portal/         # parent portal
│   ├── Student/        # student portal
│   ├── Payments/       # checkout and payment status
│   ├── Admin/          # admin panel
│   └── auth/           # shared sign-in and sign-up
├── layouts/            # EvimsAdminLayout, SiteLayout, …
└── components/

routes/
├── web.php             # public site, admission, payments, admin panel
├── portal.php          # parent portal (/portal/*)
├── student.php         # student portal (/student/*)
├── settings.php        # staff account settings
└── console.php         # scheduled commands
```

### Admin pages

Admin pages use `EvimsAdminLayout`. Each page sets its top bar title (and an optional subtitle and **(?)** help text) with Inertia's `setLayoutProps()`, instead of rendering its own heading:

```tsx
setLayoutProps({ title: 'Staff Accounts', help: 'Approve sign-up requests…' });
```

The admin side has a light/dark switch; the public site and portals are light only.

### Philippine address data

The admission form's address pickers read static JSON files committed to the repo, in `resources/data/ph-address/` (`provinces.json`, `city-mun.json`, `barangays.json`, `zip-codes.json`). `PhAddressController` caches each filtered result, and browsers cache the responses for a day. If you edit these files, bump `DATA_VERSION` in `app/Http/Controllers/Api/PhAddressController.php` so the next deploy uses fresh cache entries.

## Development

```bash
composer run dev                  # server, queue worker, logs and Vite
php artisan test --compact        # run the tests (Pest)
vendor/bin/pint                   # format PHP
composer types:check              # static analysis (Larastan)
npm run lint && npm run format    # lint and format the frontend
npm run types:check               # TypeScript check
composer ci:check                 # everything CI runs
```

CI runs the same checks on every push (`.github/workflows/tests.yml`). New endpoints need Pest feature tests covering the happy path, validation failures and unauthorized access.
