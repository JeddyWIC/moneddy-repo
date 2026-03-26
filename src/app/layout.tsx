import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const heading = Bebas_Neue({
  variable: "--font-heading",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "moneddy",
  description: "Personal process repo and notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${heading.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl font-medium tracking-wide text-yellow-700 dark:text-yellow-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                moneddy
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/insights"
                className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"
                title="Tag Insights"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
              <Link
                href="/search"
                className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              <Link
                href="/process/new"
                className="ml-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium transition-colors"
              >
                + New
              </Link>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-stone-200 dark:border-stone-800 py-6">
          <p className="text-center text-sm text-stone-400 dark:text-stone-600 tracking-wide">
            moneddy
          </p>
        </footer>
      </body>
    </html>
  );
}
