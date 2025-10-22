import NextAuth from 'next-auth';
import { authConfig } from './config';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

// For NextAuth v4, use getServerSession
import { getServerSession } from 'next-auth/next';

export const auth = () => getServerSession(authConfig);