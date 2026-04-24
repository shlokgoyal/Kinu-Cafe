# Kinu's Cafe — Admin Dashboard

React + Vite + Tailwind admin console for the Kinu's Cafe backend.

## Setup

```bash
cd admin-dashboard
npm install
npm run dev
```

Dev server runs at `http://localhost:3001` and proxies `/api/*` to `http://localhost:5000`.

## Environment

Override the API base if needed:

```
# admin-dashboard/.env.local
VITE_API_BASE_URL=http://localhost:5000/api
```

If unset, the app uses `/api` (works with the Vite dev proxy).

## Build

```bash
npm run build
npm run preview
```

## Login

Default admin credentials (from backend seed):

- Email: `admin@kinucafe.com`
- Password: `admin123`

Change the password from **Settings** after first login.

## Pages

- Dashboard — today's stats
- Orders — kitchen flow, billing, payment
- Menu items + Categories — CRUD
- Tables — CRUD with QR generation
- Coupons — CRUD
- Reservations — confirm / assign tables
- Users — admin/staff management (admin only)
- Analytics — sales, top items, customers
- Settings — cafe profile, tax, loyalty, password
