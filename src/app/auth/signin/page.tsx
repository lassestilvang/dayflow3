import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Dayflow</CardTitle>
          <CardDescription>
            Sign in to access your daily planner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignInForm />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <form
              action={async () => {
                'use server';
                await signIn('google');
              }}
            >
              <Button type="submit" className="w-full" variant="outline">
                Continue with Google
              </Button>
            </form>
            <form
              action={async () => {
                'use server';
                await signIn('github');
              }}
            >
              <Button type="submit" className="w-full" variant="outline">
                Continue with GitHub
              </Button>
            </form>
          </div>

          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}