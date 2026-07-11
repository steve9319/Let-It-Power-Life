import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Let It Power Life — Laptop Donations for NGOs",
  description:
    "Donating refurbished laptops to NGOs and NPOs across Asia. Browse available laptops, request for your organisation, and track delivery.",
};

const nav = [
  { href: "/", label: "Laptops" },
  { href: "/request", label: "Request" },
  { href: "/track", label: "Track Request" },
  { href: "/impact", label: "Our Impact" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-navy text-white">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link href="/" className="text-lg font-bold tracking-tight">
              💻 Let It Power Life
            </Link>
            <nav className="flex gap-5 text-sm text-white/90">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-white hover:underline underline-offset-4">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
        <footer className="bg-navy-dark text-white/70 text-sm">
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap justify-between gap-2">
            <span>Let It Power Life — giving laptops a second life with NGOs & NPOs.</span>
            <a href="mailto:arisatan9319@gmail.com" className="hover:text-white">
              arisatan9319@gmail.com
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
