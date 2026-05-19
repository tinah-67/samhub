# Samhub Creations Platform

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
- Manage staff accounts
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
```

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

The main goal of this platform is to provide a professional digital presence for Samhub Creations and streamline the management of brokerage assets and buyer inquiries.

---

# License

This project is private and proprietary to Samhub Creations.
