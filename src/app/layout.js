import './globals.css';

export const metadata = {
  title: 'Smart School Bus Tracker',
  description: 'Real-time school bus tracking for parents and admins',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
