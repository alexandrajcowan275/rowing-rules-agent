import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import SiteNav from "@/components/SiteNav";
const title = "Rowing Rules Agent — Evidence before answers";
const description =
  "A project by Alex Cowan: an AI agent that cites the USRowing rulebook, checks its evidence, and refuses instead of guessing. Explore real recorded outputs and honest results.";
// Vercel supplies the production hostname at build time; no application secrets are used.
const host =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
  title,
  description,
  authors: [{ name: "Alex Cowan" }],
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rowing Rules Agent — Evidence before answers. A project by Alex Cowan.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  icons: { icon: "/favicon.svg" },
};
const themeScript = `try{const t=localStorage.getItem('rowing-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.dataset.theme='dark'}catch{}`;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
