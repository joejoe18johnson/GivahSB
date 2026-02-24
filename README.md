# GivahBz — Belizean Supporting Belizeans

A Belizean-based crowdfunding platform for organizations, charities, and individuals in need. Built with Next.js, React, TypeScript, and Tailwind CSS.

**Live site:** [https://givahbz.vercel.app](https://givahbz.vercel.app) · [Campaigns](https://givahbz.vercel.app/campaigns)

## Features

- ✅ **Verification System** - All campaigns require proof of need and are verified before publication
- 🎯 **Campaign Listings** - Browse verified campaigns with filtering by category
- 📊 **Progress Tracking** - Visual progress bars showing funding status
- 💰 **Donation System** - Support campaigns with customizable donation amounts
- 📝 **Campaign Creation** - Easy-to-use form with proof document upload
- 🏥 **Medical Campaigns** - Support for medical expenses and treatments
- 🎓 **Education Support** - Help students and schools in need
- 🌪️ **Disaster Relief** - Emergency funding for communities affected by disasters
- 👥 **Organization Support** - Charities and organizations can create verified campaigns
- 📱 **Responsive Design** - Works beautifully on all devices
- 🇧🇿 **Belizean Focus** - Designed specifically for Belizean communities

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- **Supabase** account (primary backend: auth, database, storage)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up **Supabase** (primary backend):
   - Create a project at [Supabase Dashboard](https://supabase.com/dashboard)
   - In **SQL Editor**, run the migration: `supabase/migrations/20260223000000_initial.sql`
   - In **Authentication → Providers**, enable **Email** and **Google** (add your Google OAuth client ID/secret in Google Cloud Console and Supabase redirect URL)
   - In **Storage**, create buckets: `profile-photos`, `campaigns`, `verification-docs` (public read if you want public URLs, or use RLS)
   - In **Project Settings → API**, copy the project URL, anon key, and service_role key

3. Configure environment variables:
```bash
cp .env.example .env
```
   Then edit `.env` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon (public) key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (keep secret)
   - `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS` = comma-separated admin emails

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

**Google OAuth:** In Supabase → Authentication → URL Configuration, set **Site URL** to `http://localhost:3000` (or your production URL) and **Redirect URLs** to include `http://localhost:3000/auth/callback` and your production callback URL.

### Test accounts (email / password)

Use these to sign in on the login page (no signup required):

| Role   | Email               | Password  |
|--------|---------------------|-----------|
| User   | `user@test.com`     | `Test123!` |
| User   | `maria@test.com`    | `Test123!` |
| Admin  | `admin@givahbz.com` | `Admin123!` |

Add `admin@givahbz.com` to `ADMIN_EMAILS` in your `.env` so the admin account can access the admin dashboard. You can also sign in with any other email/password for ad-hoc testing.

### Authentication

The app supports multiple authentication methods:

- **Email/Password** - Traditional email and password signup/login
- **Google Sign-in** - OAuth authentication with Google

**Authentication** is handled by **Supabase Auth** (email/password and Google OAuth). Enable Google in Supabase → Authentication → Providers and set redirect URL to `https://your-domain.com/auth/callback`. Admin access is controlled by `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS`.

### Deploy (e.g. Vercel)

Add these environment variables in your host (e.g. Vercel → Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS`

**Campaign list data** is loaded from the server API (`GET /api/campaigns`), which reads from Supabase. The home page, campaigns page, my-campaigns, admin, and hearted-campaigns modal all use this API when Supabase env vars are set.

## Project Structure

```
crowdfund/
├── app/                    # Next.js app directory
│   ├── campaigns/         # Campaign pages
│   │   ├── [id]/         # Individual campaign page
│   │   └── create/       # Create campaign page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── CampaignCard.tsx  # Campaign card component
│   ├── DonateButton.tsx  # Donation functionality
│   ├── Footer.tsx        # Site footer
│   └── Header.tsx        # Site header
└── lib/                  # Utilities and data
    └── data.ts           # Mock campaign data
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## Campaign Categories

- **Medical** - Medical treatments, surgeries, healthcare expenses
- **Education** - School supplies, tuition, educational resources
- **Disaster Relief** - Hurricane, flood, and emergency relief
- **Community** - Community projects and initiatives
- **Emergency** - Urgent financial needs
- **Other** - Other verified needs

## Verification Process

All campaigns must provide proof of need, such as:
- Medical reports or doctor's notes
- Financial statements
- Official identification
- Organization registration documents
- Other relevant documentation

Campaigns are reviewed and verified before being published to ensure transparency and trust.

## Supabase Integration

This project uses **Supabase** as the primary backend:

- ✅ **Supabase Auth** - User signup, login (email/password + Google), and session management
- ✅ **PostgreSQL (Supabase)** - Campaigns, profiles, donations, notifications, site config
- ✅ **Supabase Storage** - Profile photos, campaign images, verification documents

Run the SQL migration in `supabase/migrations/20260223000000_initial.sql` in the Supabase SQL Editor, then create Storage buckets `profile-photos`, `campaigns`, and `verification-docs` in the dashboard.

## Future Enhancements

- Payment integration (local Belizean payment methods)
- Real-time updates and notifications
- Advanced search and filtering
- Email notifications
- Social sharing
- Analytics dashboard
- Admin panel for campaign verification
- Multi-language support (English, Spanish, Creole)

## Git: "Unable to merge unrelated histories"

If you see this (e.g. when pulling or merging on GitHub), merge locally then push:

```bash
git pull origin main --allow-unrelated-histories --no-rebase --no-edit
git push origin main
```

## License

MIT
