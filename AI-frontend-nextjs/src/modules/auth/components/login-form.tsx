// 'use client': uses state and event handlers, so it runs in the browser.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/modules/auth/hooks/auth.hooks";

// Login page form: collects email + password, validates, and logs the user in.
export function LoginForm() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  // Each useState holds one piece of form/UI state; the setter re-renders the component with the new value.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If the user is already logged in, skip the form and go to the dashboard.
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  // Runs when the form is submitted: validate, call login, redirect; show an error message on failure.
  async function onSubmit(e: React.FormEvent) {
    // Stop the browser's default full-page form submit.
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Email and password are required");
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  }

  // Avoid flashing the form while checking the session or redirecting.
  if (isLoading || user) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;

  return (
    <AuthShell>
      <Card className="w-full max-w-sm shadow-lg">
        <form onSubmit={onSubmit} noValidate>
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Log in to your workspace</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </Button>
            <p className="text-sm text-muted-foreground">
              No account? <Link href="/register" className="font-medium text-foreground underline">Register</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
