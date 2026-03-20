import { createRootRouteWithContext, HeadContent, Outlet, Scripts, ScriptOnce } from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ConvexClient } from "convex/browser";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import appCss from "../index.css?url";

interface RouterContext {
  queryClient: QueryClient;
  convexClient: ConvexClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "ScholarHub - Find Your Scholarship" },
      { name: "description", content: "Browse 2,400+ international scholarships. Filter by country, degree, funding, and eligibility." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600&display=swap" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { convexClient, queryClient } = Route.useRouteContext();
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground font-base">
        <ScriptOnce>{`
          document.documentElement.classList.toggle('dark',
            localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
          );
        `}</ScriptOnce>
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
