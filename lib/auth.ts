import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import { USERS } from '@/lib/rbac/roles'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Page Studio',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'editor@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = USERS[credentials.email]
        if (!user || user.password !== credentials.password) return null
        return { id: credentials.email, email: credentials.email, name: credentials.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.role = token.role as string
      return session
    },
  },
  // Fallback keeps dev working without .env.local; must be overridden in production
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-replace-in-production',
}
