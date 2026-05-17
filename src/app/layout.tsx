import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Établi — suivi de montage PC',
  description:
    'Composez vos builds PC pièce par pièce, comparez les alternatives, suivez les prix et les délais de livraison.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="topbar">
          <Link href="/" className="brand" aria-label="Établi — accueil">
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 9h18M9 9v12" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="6" cy="6" r="1.1" fill="currentColor" />
              </svg>
            </span>
            <span className="brand__text">
              <span className="brand__name">Établi</span>
              <span className="brand__tag">suivi de montage PC</span>
            </span>
          </Link>
        </header>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
