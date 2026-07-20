import Image from "next/image";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin/boats" });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw err;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-marine-950 px-6">
      <div className="w-full max-w-sm rounded-sm border border-white/10 p-8">
        <div className="flex items-center gap-3">
          <Image
            src="/images/brand/logo.webp"
            alt="Leal Collection"
            width={288}
            height={362}
            className="h-14 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
            priority
            unoptimized
          />
          <h1 className="font-display text-2xl text-white">Leal Collection — Admin</h1>
        </div>
        <form action={login} className="mt-8 space-y-4">
          <input
            required
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-sm border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:border-gold-300 focus:outline-none"
          />
          <input
            required
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-sm border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:border-gold-300 focus:outline-none"
          />
          {error && (
            <p className="text-sm text-red-400">Incorrect email or password.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-gold-500 px-8 py-3 text-sm uppercase tracking-widest text-marine-950 transition hover:bg-gold-300"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
