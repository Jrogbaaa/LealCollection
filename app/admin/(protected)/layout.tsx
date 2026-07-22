import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fail closed: if the admin credentials aren't configured, auth() has nothing to check
  // sessions against and must never be trusted to fail safe on its own (see AUTH_SECRET
  // incident in agent-harness/decisions.md — an unset secret let this route render with no
  // session check at all).
  if (!process.env.AUTH_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-marine-950 px-6 text-center">
        <p className="max-w-sm text-sm text-white/70">
          Admin is not configured yet — set AUTH_SECRET, ADMIN_EMAIL and
          ADMIN_PASSWORD_HASH in .env.local.
        </p>
      </main>
    );
  }

  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="flex flex-col gap-3 border-b border-marine-950/10 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/admin/boats" className="flex min-w-0 items-center gap-3">
          <Image
            src="/images/brand/logo.webp"
            alt="Leal Collection"
            width={288}
            height={362}
            className="h-14 w-auto"
            priority
            unoptimized
          />
          <span className="font-display text-lg leading-tight text-marine-950 sm:text-xl">
            Leal Collection — Admin
          </span>
        </Link>
        <nav className="flex w-full items-center justify-between gap-4 border-t border-marine-950/10 pt-3 text-sm text-marine-900/80 md:w-auto md:justify-start md:gap-6 md:border-0 md:pt-0">
          <Link href="/admin/boats" className="hover:text-marine-950">
            Boats
          </Link>
          <Link href="/admin/bookings" className="hover:text-marine-950">
            Bookings
          </Link>
          <Link href="/admin/blocked-dates" className="hover:text-marine-950">
            Blocked dates
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="hover:text-marine-950">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
