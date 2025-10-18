import { auth } from '@/lib/auth';

export default auth((req) => {
  // Redirect to sign in if not authenticated and trying to access protected routes
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    const newUrl = new URL('/auth/signin', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};