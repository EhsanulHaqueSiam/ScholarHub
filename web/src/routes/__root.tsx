import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";
import appCss from "../index.css?url";

const organizationJsonLd = JSON.stringify(buildOrganizationJsonLd());
const ga4Id = import.meta.env.VITE_GA4_ID ?? "";
const gscVerification = import.meta.env.VITE_GSC_VERIFICATION ?? "";

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
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "ScholarHub - Find Your Scholarship" },
      {
        property: "og:description",
        content:
          "Browse 2,400+ international scholarships. Filter by country, degree, funding, and eligibility.",
      },
      { property: "og:image", content: "/api/og?type=default" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(gscVerification ? [{ name: "google-site-verification", content: gscVerification }] : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600&display=swap",
      },
      { rel: "alternate", hreflang: "en", href: "https://scholarhub.io" },
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
        {ga4Id && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined' && '${ga4Id}') {
              var s = document.createElement('script');
              s.src = 'https://www.googletagmanager.com/gtag/js?id=${ga4Id}';
              s.async = true;
              document.head.appendChild(s);
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            }
          `}</ScriptOnce>
        )}
        {/* Organization JSON-LD -- static, trusted content for SEO structured data */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Static trusted Organization JSON-LD for SEO, no user input
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
