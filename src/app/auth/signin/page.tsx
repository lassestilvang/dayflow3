
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';
import { Suspense } from 'react';
import { signIn } from 'next-auth/react';

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
          <Suspense fallback={<div>Loading...</div>}>
            <SignInForm />
          </Suspense>
          
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
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => signIn('google')}
            >
              Continue with Google
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => signIn('github')}
            >
              Continue with GitHub
            </Button>
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