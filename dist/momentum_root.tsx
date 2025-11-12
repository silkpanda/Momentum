// =========================================================
// silkpanda/momentum-web/app/page.tsx
// Landing Page (Public Route)
// =========================================================--
import Link from 'next/link';
// Assuming a standard icon library setup (e.g., Lucide)
// Placeholder for Lucide imports until the specific library is installed
// import { User, LogIn, HeartHandshake } from 'lucide-react'; 

/**
 * @fileoverview Landing page component to direct users to Auth endpoints.
 * @component Page
 */
export default function Page() {

  // --- Reusable Component: Navbar for simple navigation ---
  const LandingNavbar = () => (
    <nav className="flex justify-between items-center h-16 px-6 bg-bg-surface border-b border-border-subtle shadow-sm">
      <div className="text-xl font-semibold text-text-primary">
        Momentum
      </div>
      <div className="flex space-x-4">
        {/* Secondary Button: Login (Source: Style Guide, 5. Component Design, 3. Secondary Button) */}
        <Link href="/login"
          className="text-text-primary hover:text-action-primary font-medium p-2 transition-colors flex items-center"
        >
          {/*  - Mandatory icon paired with text label [cite: 69] */}
          {/* Placeholder for Lucide LogIn */}
          <span className="mr-1">🔑</span>
          Login
        </Link>
      </div>
    </nav>
  );

  // --- Reusable Component: Primary/Secondary Buttons ---
  const PrimaryButton = ({ href, text }: { href: string, text: string }) => (
    <Link href={href}
      className="inline-flex justify-center items-center rounded-lg py-3 px-8 text-base font-medium shadow-md
                 bg-action-primary text-white transition-all duration-200
                 hover:bg-action-hover hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-action-primary/50"
    >
      {text}
    </Link>
  );

  const SecondaryLink = ({ href, text }: { href: string, text: string }) => (
    <Link href={href}
      className="text-action-primary font-medium hover:underline transition-colors duration-200"
    >
      {text}
    </Link>
  );

  // --- Main Content ---
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">

        {/* Application Logo/Icon - Placeholder for now */}
        {/*  */}
        <div className="text-signal-success mb-6" style={{ fontSize: '4rem' }}>
          <span className="text-action-primary">✨</span>
        </div>

        {/* H1 - Screen Title (Source: Style Guide, 2. Typography, Screen Title (H1)) */}
        <h1 className="text-4xl sm:text-5xl font-semibold text-text-primary max-w-4xl mb-4 leading-tight font-inter">
          The calm, focused way to manage family tasks and rewards.
        </h1>

        {/* Body / Description (Source: Style Guide, 2. Typography, Body / Descriptions (Body-Small) */}
        <p className="text-lg text-text-secondary max-w-2xl mb-10 font-normal">
          Momentum helps every family member focus on what matters. Parents get a clear dashboard, and kids get a fun, frictionless way to complete tasks and earn points.
        </p>

        {/* Primary CTA (Sign Up - For new Parents) */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <PrimaryButton
            href="/signup"
            text="Get Started (Parent Sign Up)"
          />
          {/* Secondary Text Link */}
          <SecondaryLink
            href="/features"
            text="See Features"
          />
        </div>

        {/* Section for Existing Users */}
        <div className="mt-12 pt-8 border-t border-border-subtle w-full max-w-md">
          <p className="text-text-secondary text-sm">
            Already have an account? <SecondaryLink href="/login" text="Login Here" />
          </p>
        </div>

      </main>

      <footer className="h-12 flex items-center justify-center bg-bg-surface border-t border-border-subtle">
        <p className="text-sm text-text-secondary">© 2025 Momentum App. All rights reserved.</p>
      </footer>
    </div>
  );
}