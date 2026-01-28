import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "3A Dashboard | Automation · Analytics · AI",
  description: "Dashboard de gestion des leads et automatisations pour 3A Automation",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme detection script - runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme');
                if (stored === 'light') {
                  document.documentElement.classList.add('light');
                } else if (stored === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                // If no stored preference, system preference via CSS media query applies
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
