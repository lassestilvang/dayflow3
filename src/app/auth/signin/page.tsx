import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}