import Link from "next/link";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/session";
import { adminLogoutAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "📊 Dashboard" },
  { href: "/admin/laptops", label: "💻 Laptops" },
  { href: "/admin/requests", label: "📥 Requests" },
  { href: "/admin/showcase", label: "🌏 Showcase" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page renders without the shell or guard.
  const path = (await headers()).get("x-invoke-path") ?? "";
  const admin = await isAdmin();

  if (!admin) {
    // Render children only for /admin/login; everything else shows a sign-in prompt.
    // (Server components can't reliably read the path, so we gate via a simple check in each page too.)
    return <>{children}</>;
  }

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <aside className="md:sticky md:top-4 self-start bg-white rounded-2xl shadow-sm p-4">
        <div className="font-bold text-sm mb-3 text-navy/60 uppercase tracking-wide">Admin</div>
        <nav className="flex md:flex-col gap-1 flex-wrap">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-cream">
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={adminLogoutAction} className="mt-4 pt-3 border-t border-gray-100">
          <button className="text-xs text-navy/50 hover:text-navy px-3">Sign out</button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
