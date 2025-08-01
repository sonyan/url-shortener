// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import { compare } from 'bcryptjs';
import { rateLimitByIp } from '../../../lib/rateLimitSimple';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Get IP address from request
        const ip = req?.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '';
        const rateLimitError = await rateLimitByIp(ip, 'ratelimit:signin', 10, 60);
        if (rateLimitError) {
          throw new Error(rateLimitError);
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });
        if (user && credentials?.password && await compare(credentials.password, user.password)) {
          return { id: user.id, email: user.email };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
