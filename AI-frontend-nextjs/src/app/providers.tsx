// 'use client': this file needs React state, so it must run in the browser.
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Wraps the whole app with TanStack Query's provider so any component can fetch and cache server data.
export function Providers({ children }: { children: React.ReactNode }) {
  // Create the QueryClient (the cache) once. Passing a function to useState makes sure it is built only on the first render,
  // so the cache isn't thrown away on re-renders.
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
