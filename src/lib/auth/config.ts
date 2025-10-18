import type { NextAuthOptions } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

export const authConfig: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
          
          if (!user.length) {
            console.log('User not found:', credentials.email);
            return null;
          }

          if (!user[0].password) {
            console.log('User has no password (OAuth user)');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user[0].password);
          
          if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
          }

          console.log('Authentication successful for:', user[0].email);

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        (session.user as { id: string }).id = token.sub;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};