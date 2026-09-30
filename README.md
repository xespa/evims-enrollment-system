# EVIMS Enrollment System

EVIMS is an online enrollment and school website system. It has three parts:

- **Public school website**: home, about, academics, student services, events, contact.
- **Enrollee portal**: parents and guardians register, submit applications, upload documents and pay tuition by GCash through PayMongo.
- **Admin panel**: staff review applications, verify documents, assign LRNs, record cash payments and manage grade levels, fees, subjects and events.

## Tech stack

| Layer    | Tools |
|----------|-------|
| Backend  | PHP 8.4, Laravel 13, Laravel Fortify (admin auth) |
| Frontend | React 19, Inertia.js v3, Tailwind CSS v4, Vite |
| Routing  | Ziggy (`route()` in React), Laravel Wayfinder |
| Payments | PayMongo (GCash checkout plus webhooks) |
| Testing  | Pest v4, Larastan, Pint, ESLint, Prettier |

## Requirements

- PHP 8.4 and Composer
- Node.js 22+ and npm
- MySQL (or SQLite for local development)
- A PayMongo account (test keys work) for online payments

## Getting started

```bash
git clone <repo-url> evims-enrollment-system
cd evims-enrollment-system

composer setup        # installs dependencies, creates .env, generates key, migrates, builds assets
php artisan db:seed   # grade levels, fees, subjects and default users
composer run dev      # runs the server, queue worker, logs and Vite together
```

Then open `http://localhost:8000`.

### Default accounts (from the seeder)

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | `admin@example.com` | `password` |
| Staff | `test@example.com`  | `password` |

Enrollee (parent) accounts are separate. Create one at `/portal/register`.

### Philippine address data

The address pickers load JSON files from `storage/app/ph-address/`. These files are not in git, so copy them in before using the admission form:

```
storage/app/ph-address/
├── provinces.json
├── city-mun.json
├── barangays.json
└── zip-codes.json
```

## Configuration

Copy `.env.example` to `.env` (`composer setup` does this for you) and fill in the values below.

**Database**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=evims
DB_USERNAME=root
DB_PASSWORD=
```

**Mail.** This is needed for enrollee email verification and for status and reminder emails.

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-address@gmail.com
MAIL_PASSWORD="your-app-password"
MAIL_FROM_ADDRESS="evims@example.com"
```

For local development you can use `MAIL_MAILER=log` so emails are written to `storage/logs/laravel.log`.

**PayMongo / GCash**

```env
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_...
PAYMONGO_SANDBOX_MODE=false

SCHOOL_GCASH_NUMBER=0917-123-4567
SCHOOL_GCASH_NAME="EVIMS School Inc."
```

- Setting `PAYMONGO_SANDBOX_MODE=true` skips PayMongo entirely. It uses a built-in fake checkout page (`/payments/sandbox/{payment}/checkout`), so you can test the whole payment flow without API keys.
- In PayMongo, point the webhook at `https://<your-domain>/paymongo/webhook`. It must be reachable from the internet, so use a tunnel such as ngrok for local testing.

## How enrollment works

1. **Register.** A parent creates an enrollee account at `/portal/register` and verifies their email.
2. **Apply.** The parent fills in the admission form at `/admission`: student info, address, parents, academic history, subjects, and a billing plan. An application starts as `PENDING`.
3. **Upload documents.** The parent uploads Form 138, a birth certificate and a good moral certificate from the portal dashboard.
4. **Review.** An admin opens the application (`/admin/enrollments/{id}`), verifies the documents, can send reminders for missing ones, and sets the status to `APPROVED` or `REJECTED`. The parent gets an email and an in-portal notification.
5. **Pay.** Once an application is approved, the parent pays each installment by GCash through a signed payment link. PayMongo's webhook and the return URLs mark installments as paid. Admins can also record cash payments.

### Billing plans

Tuition is split into installments over a 10-month school year:

| Plan           | Installments |
|----------------|--------------|
| `FULL_PAYMENT` | 1            |
| `BI_MONTHLY`   | 5            |
| `MONTHLY`      | 10           |

When an admin edits a grade level's fees, the unpaid installments of existing enrollments are repriced.

## Project structure

```
app/
├── Http/Controllers/
│   ├── Admin/          # admin panel: students, enrollments, grade levels, subjects, events, settings
│   ├── Portal/         # enrollee portal: auth, email verification, dashboard, notifications, profile
│   ├── Api/            # PH address lookup endpoints
│   ├── EnrollmentController.php   # public admission form
│   └── PaymentController.php      # GCash checkout, callbacks, webhook, sandbox
├── Models/             # Enrollment, Student, GradeLevel, BillingContract, Installment, Payment, ...
├── Services/           # PayMongoService, GcashPaymentSync
├── Notifications/      # in-portal notifications
└── Mail/               # status update emails

resources/js/pages/
├── Site/               # public website
├── Enrollment/         # multi-step admission form
├── Portal/             # enrollee portal
├── Payments/           # payment pages
└── Admin/              # admin panel

routes/
├── web.php             # public site, admission, payments, admin
├── portal.php          # enrollee portal (/portal/*)
└── settings.php        # staff account settings
```

## Authentication

There are two separate login systems:

- **Staff and admins** (`users` table) use Fortify at `/login`. Admin-only pages live under `/admin` and are protected by the `admin` middleware.
- **Enrollees** (`enrollee_users` table) use the `enrollee` guard at `/portal/login`, and must verify their email before they can see the portal dashboard.

## Development

```bash
composer run dev                  # server, queue, logs and Vite
php artisan test --compact        # run the test suite
vendor/bin/pint                   # format PHP
npm run lint && npm run format    # lint and format the frontend
npm run types:check               # TypeScript check
composer ci:check                 # every check CI runs
```

Queued jobs and notifications use the database queue (`QUEUE_CONNECTION=database`). `composer run dev` starts a worker for you. In production, run `php artisan queue:work` under a process manager.
