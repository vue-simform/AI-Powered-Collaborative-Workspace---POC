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

// Registration form: validates input, creates the account, then logs the user in automatically.
export function RegisterForm() {
  const { user, isLoading, register, login } = useAuth();
  const router = useRouter();
  // All input values live in one object; 'error', 'success' and 'submitting' drive the messages and the button.
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If the user is already logged in, skip the form and go to the dashboard.
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  // Helper that builds an onChange handler for a given field, updating just that key in the form object.
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Runs on submit: check fields and matching passwords, register, then log in and go to the dashboard.
  async function onSubmit(e: React.FormEvent) {
    // Stop the browser's default full-page form submit.
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email || !form.password || !form.confirm) {
      return setError("All fields are required");
    }
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      setSuccess(true);
      await login({ email: form.email, password: form.password });
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err, "Registration failed"));
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
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Start collaborating with your team</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
              <p className="text-xs text-muted-foreground">At least 8 characters, with a letter and a number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {success && <p role="status" className="text-sm text-green-600">Account created. Signing you in...</p>}
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting || success}>
              {submitting ? "Creating account..." : "Register"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already registered? <Link href="/login" className="font-medium text-foreground underline">Login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
