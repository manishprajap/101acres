// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Replace with your DB user lookup
        const user = {
          id: '1',
          name: 'John Doe',
          email: credentials?.email,
          role: 'admin', // 'admin' | 'agent' | 'user'
        };
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
        if (token?.role && session.user) {
          session.user.role = token.role as string; // 👈 Assign role from token to session
        }
        return session;
      }
  },
  pages: {
    signIn: '/landing',
  },
});

export { handler as GET, handler as POST };