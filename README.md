# Smart School Bus Tracking System (Next.js + Supabase + Tailwind CSS)

Welcome to the fully functional, responsive, and browser-based version of the Smart School Bus Tracking System. Re-architected on top of a highly-scalable, production-level stack natively compatible with **Vercel deployability**.

## 🚀 The Stack
- **Framework:** Next.js 14 (App Router, strict Client/Server boundaries)
- **Styling:** Tailwind CSS (Premium minimalist aesthetic, glassmorphism logic)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Realtime Postgres Changes)
- **Mapping:** Google Maps JavaScript API (Geocoding & Marker streaming)

## ✨ Core Features
- **Real-time Postgres Tracking:** Streaming live bus GPS locations over Supabase's natively integrated WebSocket channels (Postgres Changes) utilizing true row-level security.
- **Supabase Authentication:** Features both OTP and Magic Link (Email) Login natively. Handshakes smoothly to our custom `users` database table for role determination.
- **Offline Tracking / PWA:** Utilizing `localStorage` algorithms to seamlessly jumpstart the Next.js parent dashboard immediately with the last-known database location while the WebSocket re-establishes connection. Includes a PWA manifest for desktop installation.
- **Role-Based Web Dashboards:** 
  - **Parents:** Dedicated map UI displaying real-time locations listening to Postgres inserts.
  - **Drivers:** Binds the `navigator.geolocation` HTML5 API tracking to a Supabase Postgres UPSERT layer.
  - **Admins:** View all active fleets globally and push critical delay warnings securely to the `notifications` table which actively pings all live clients.

---

## 🏗️ Project Structure
\`\`\`
.
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.js  # Dedicated Supabase Magic Link auth UI
│   │   ├── admin/                # Global fleet overview & Alert dispatch
│   │   ├── parent/               # Live Google Map for parents via PostgreSQL changes
│   │   ├── driver/               # Web Geolocation API upserting to Supabase DB
│   │   ├── globals.css           # Premium Tailwind layers
│   │   ├── layout.js             # Root App Layout 
│   │   └── page.js               # Redirection engine
│   └── lib/
│       └── supabaseClient.js     # Supabase Singleton Instance
├── tailwind.config.js
├── postcss.config.js
├── next.config.mjs               # Adjusted for Vercel/Webpack stability
├── supabase_schema.sql           # Raw SQL to inject into Supabase UI
└── package.json                  
\`\`\`

---

## 🛠️ Step-by-Step Setup
Read the \`SETUP_GUIDE.md\` specifically designed for you to set up the Supabase PostgreSQL Database effortlessly.

Once your keys are obtained, place them securely in a `.env.local` file:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."
\`\`\`

---

## 🌐 Deploy to Vercel (Production Build)
This project is already pre-configured to be deployed natively on Vercel without build errors.

1. Push your code to GitHub.
2. Login to [Vercel](https://vercel.com/new) and select **Add New Project**.
3. Import the repository.
4. Next.js will be auto-detected.
5. Provide all `NEXT_PUBLIC` variables from your `.env.local` file into the UI.
6. Click **Deploy**. Vercel will install dependencies, safely compile client-side Supabase references, output the static assets via Tailwind JIT, and assign your Edge URL!

*(Note: There is no need for `undici` Webpack tweaks anymore because Supabase uses a fully isolated Edge-ready `fetch` algorithm under the hood, making this natively superior to Vercel deployments!)*