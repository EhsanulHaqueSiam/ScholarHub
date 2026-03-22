import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";
import { CompareBar } from "@/components/comparison/CompareBar";
import { CompareProvider } from "@/components/comparison/CompareContext";
import appCss from "../index.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "ScholarHub - Find Your Scholarship" },
      {
        name: "description",
        content:
          "Browse 2,400+ international scholarships. Filter by country, degree, funding, and eligibility.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body className="grid-bg">
        <ScriptOnce>{`
          document.documentElement.classList.toggle('dark',
            localStorage.theme === 'dark'
          );
        `}</ScriptOnce>
        <CompareProvider>
          <Outlet />
          <CompareBar />
        </CompareProvider>
        <Scripts />
      </body>
    </html>
  );
}
