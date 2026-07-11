import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";

/** Call at the top of every admin page. Redirects to /admin/login when not signed in. */
export async function requireAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
}
