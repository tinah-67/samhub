# SamHub Creations Platform

A modern brokerage management platform for managing and showcasing:

- Vehicles
- Houses
- Land

Built for :contentReference[oaicite:0]{index=0}.

The platform allows the company to manage listings, inquiries, and internal operations from a centralized admin dashboard.

---

# Features

## Public Features
- Browse vehicle listings
- Browse houses and apartments
- Browse land listings
- Search and filtering
- Listing details pages
- Inquiry/contact system
- WhatsApp integration
- Responsive design

---

## Admin Features
- Admin authentication
- Manage listings
- Upload listing images
- Manage inquiries
- Manage internal accounts
- Dashboard analytics (future)

---

# Tech Stack

## Frontend
- Next.js
- Tailwind CSS
- React

---

## Backend
- Node.js
- Express.js
- Prisma ORM

---

## Database
- PostgreSQL

---

## Storage
- Cloudinary

---

# Monorepo Structure

```bash
samhub/
│
├── apps/
│   ├── frontend/     # Next.js frontend
│   └── backend/      # Express backend
│
├── package.json
├── .gitignore
└── README.md
```

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/tinah-67/samhub.git
cd samhub
```

---

# Install Dependencies

## Root Dependencies

```bash
npm install
```

---

## Frontend Dependencies

```bash
cd apps/frontend
npm install
```

---

## Backend Dependencies

```bash
cd ../backend
npm install
```

---

# Environment Variables

Create a `.env` file inside:

```bash
apps/backend/.env
```

Example:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/samhub"
JWT_SECRET=your_secret_key
SEED_ADMIN_EMAIL="admin@samhubcreations.com"
SEED_ADMIN_NAME="SamHub Admin"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
EMAIL_FROM="SamHub Creations <no-reply@example.com>"
```

---

# First Admin Account

Apply the Prisma schema changes before using the admin login flow:

```bash
npm run prisma:migrate --workspace=backend
```

There is no public registration link. Create the first admin account with the seed script, then use `/admin/login` directly. The seed script emails a one-time setup code to `SEED_ADMIN_EMAIL`; in local development without SMTP configured, the code is printed in the backend console.

```bash
npm run seed --workspace=backend
```

After the first admin signs in, they can create additional internal accounts from the admin dashboard. New accounts receive a one-time setup code by email and set their own password.

---

# Running the Project

From the root folder:

```bash
npm run dev
```

---

# Development Servers

## Frontend
```bash
http://localhost:3000
```

## Backend
```bash
http://localhost:5000
```

---

# Scripts

## Run Frontend

```bash
npm run dev:frontend
```

---

## Run Backend

```bash
npm run dev:backend
```

---

# Planned Features

- Role-based access control
- Advanced search
- SEO optimization
- Booking/view scheduling
- Analytics dashboard
- Notifications
- Payment integration
- Featured listings

---

# Project Goals

The main goal of this platform is to provide a professional digital presence for SamHub Creations and streamline the management of brokerage assets and buyer inquiries.

---

# License

This project is private and proprietary to SamHub Creations.
