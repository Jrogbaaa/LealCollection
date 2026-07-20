import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

/**
 * Fail closed: never let a mutation proceed just because auth() didn't throw. If the admin
 * credentials aren't configured, auth() has nothing to check sessions against and must not
 * be trusted on its own (see AUTH_SECRET incident in agent-harness/decisions.md).
 */
export async function requireAdmin() {
  if (!process.env.AUTH_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
    throw new Error("admin_not_configured");
  }
  const session = await auth();
  if (!session) throw new Error("unauthorized");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminEmail || !adminPasswordHash) {
          return null;
        }

        if (email.toLowerCase() !== adminEmail.toLowerCase()) {
          return null;
        }

        const valid = await compare(password, adminPasswordHash);
        if (!valid) return null;

        return { id: "admin", email: adminEmail };
      },
    }),
  ],
});
