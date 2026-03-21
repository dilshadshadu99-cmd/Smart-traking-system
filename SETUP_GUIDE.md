# Supabase Setup Guide - Smart School Bus Tracker

To deploy this web application fully functional, you must set up a Supabase project and provide the Vercel app with its keys. 

## 1. Supabase Project Setup

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. In your Project Dashboard, go to **Project Settings > API**.
3. Copy the **Project URL** and the **anon** `public` key.

## 2. SQL Database Initialization

1. Go to the **SQL Editor** on the left menu.
2. Click **New query**.
3. Open the `supabase_schema.sql` file in the root of this repository, copy all of its contents, and paste it into the editor.
4. Click **Run**.
*(This will automatically generate the required `users`, `buses`, `bus_locations`, and `notifications` tables natively linked to your Auth module, along with broadcasting real-time logs).*

## 3. Enable Authentication Settings

1. In Supabase, go to **Authentication > Configuration > Email Templates**.
2. **Magic Link**: The default template is fine.
3. If you specifically want 6-digit OTPs instead of links, edit the template to send `{{ .Token }}` instead of the `{{ .ConfirmationURL }}`.
4. Go to **Authentication > URL Configuration**.
5. Ensure your `Site URL` is set to `http://localhost:3000` (for local dev) or your deployed Vercel domain (e.g., `https://my-bus-app.vercel.app`).
6. Under **Redirect URLs**, add `http://localhost:3000/login` and `https://my-bus-app.vercel.app/login`.

## 4. Environment Variables Locally

Create a `.env.local` file at the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_KEY"
```

## 5. Vercel Deployment

1. Make sure you push this Next.js project to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. The framework preset should auto-detect **Next.js**.
5. **Important**: Under **Environment Variables**, paste the 3 variables from your `.env.local`.
6. Click **Deploy**. Vercel will install the Supabase client safely and compile the Tailwind styling!
