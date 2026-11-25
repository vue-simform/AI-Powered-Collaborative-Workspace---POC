// 'use client': uses hooks and browser navigation, so it runs in the browser.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/auth.hooks";

// The '/' page. It shows nothing itself, it only redirects: logged in -> /dashboard, otherwise -> /login.
export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Wait until the session check is done, then redirect.
  useEffect(() => {
    if (!isLoading) router.replace(user ? "/dashboard" : "/login");
  }, [user, isLoading, router]);

  return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
}
