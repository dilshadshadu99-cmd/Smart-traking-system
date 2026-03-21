# Setup Guide - Smart School Bus Tracker

To make this web application fully functional and deploy it, you need to set up Firebase and Google Maps, then add their keys to the Vercel dashboard.

## 1. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**. Follow the prompts.
3. In your project overview, click the **Web `</>`** icon to add a web app.
4. Name your app, and click **Register app**.
5. Copy the `firebaseConfig` keys provided.

### 🔑 Authentication (OTP + Magic Link)
1. Go to **Build > Authentication**. Click **Get Started**.
2. Go to the **Sign-in method** tab.
3. Enable **Phone Provider** for OTP.
4. Enable **Email/Password Provider** and specifically turn on **Email link (passwordless sign-in)**.
5. Setup a test phone number in the Phone provider settings to avoid SMS limits during testing.

### 🗄️ Realtime Database
1. Go to **Build > Realtime Database**. Click **Create Database**.
2. Start in **Test Mode** (or update security rules later to allow read/write for authenticated users).
3. Copy the URL at the top of the database (e.g. `https://<PROJECT_ID>.firebaseio.com/`). You will need this for the `.env` `NEXT_PUBLIC_FIREBASE_DATABASE_URL` variable.

### 🔔 Cloud Messaging (Push Notifications)
1. Go to **Project Settings > Cloud Messaging**.
2. Under "Web configuration", generate a generic Key Pair for VAPID. You will use this key in your web app to receive pushes.

---

## 2. Google Maps API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Go to **APIs & Services > Library**.
4. Search for and enable **Maps JavaScript API**.
5. Go to **APIs & Services > Credentials**.
6. Click **Create Credentials > API Key**.
7. Restrict the key (highly recommended) for web usage and only allowing Maps API.
8. Copy the key. This will be `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## 3. Environment Variables (.env.local)

Create a `.env.local` file at the root of the `web` folder. Fill it with your keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

---

## 4. Vercel Deployment

1. Make sure you push this Next.js project to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. The framework preset should auto-detect **Next.js**.
5. Under Build and Output settings, it should naturally say Build Command: `npm run build` safely.
6. **Important**: Under **Environment Variables**, paste all the variables from your `.env.local` file.
7. Click **Deploy**.

## Troubleshooting
* **Blank Map**: Ensure your Google API Key is valid and the Maps JavaScript API is explicitly "Enabled" in the cloud console.
* **Can't login via OTP**: Make sure the domain where you are testing (localhost or `vercel.app`) is added to the "Authorized domains" under Firebase Authentication inside Settings.
