import { withAuth } from 'next-auth/middleware';
import type { NextRequest } from 'next/server';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/signup).*)'],
};