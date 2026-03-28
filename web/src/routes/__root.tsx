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
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";
import appCss from "../index.css?url";

const organizationJsonLd = JSON.stringify(buildOrganizationJsonLd());
const ga4Id = import.meta.env.VITE_GA4_ID ?? "";
const gscVerification = import.meta.env.VITE_GSC_VERIFICATION ?? "";
const metaPixelId = import.meta.env.VITE_META_PIXEL_ID ?? "";
const tiktokPixelId = import.meta.env.VITE_TIKTOK_PIXEL_ID ?? "";
const twitterPixelId = import.meta.env.VITE_TWITTER_PIXEL_ID ?? "";
const linkedinPartnerId = import.meta.env.VITE_LINKEDIN_PARTNER_ID ?? "";
const pinterestTagId = import.meta.env.VITE_PINTEREST_TAG_ID ?? "";
const snapchatPixelId = import.meta.env.VITE_SNAPCHAT_PIXEL_ID ?? "";
const bingUetId = import.meta.env.VITE_BING_UET_ID ?? "";

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
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap",
      },
      { rel: "alternate", hrefLang: "en", href: "https://scholarhub.io" },
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
        {/* Meta (Facebook/Instagram) Pixel */}
        {metaPixelId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
              (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${metaPixelId}');fbq('track','PageView');
            }
          `}</ScriptOnce>
        )}
        {metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        {/* TikTok Pixel */}
        {tiktokPixelId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
              ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
              ttq._o=ttq._o||{};ttq._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";
              s.async=!0;s.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];
              a.parentNode.insertBefore(s,a)};
              ttq.load('${tiktokPixelId}');ttq.page();
            }(window,document,'ttq');
          `}</ScriptOnce>
        )}
        {/* Twitter/X Pixel */}
        {twitterPixelId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},
              s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,
              u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}
              (window,document,'script');
              twq('config','${twitterPixelId}');
            }
          `}</ScriptOnce>
        )}
        {/* LinkedIn Insight Tag */}
        {linkedinPartnerId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              window._linkedin_partner_id='${linkedinPartnerId}';
              window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
              window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
              !function(l){if(!l.lintrk){var s=l.lintrk=function(a,b){s.fired=!0;s.a=a;s.b=b};
              s.fired=!1;var n=document.createElement('script');n.type='text/javascript';n.async=!0;
              n.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';
              var o=document.getElementsByTagName('script')[0];o.parentNode.insertBefore(n,o)}}(window);
            }
          `}</ScriptOnce>
        )}
        {linkedinPartnerId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://px.ads.linkedin.com/collect/?pid=${linkedinPartnerId}&fmt=gif`}
              alt=""
            />
          </noscript>
        )}
        {/* Pinterest Tag */}
        {pinterestTagId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
              var n=window.pintrk;n.queue=[],n.version="3.0";
              var t=document.createElement("script");t.async=!0,t.src=e;
              var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}
              ("https://s.pinimg.com/ct/core.js");
              pintrk('load','${pinterestTagId}');pintrk('page');
            }
          `}</ScriptOnce>
        )}
        {pinterestTagId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://ct.pinterest.com/v3/?event=init&tid=${pinterestTagId}&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        {/* Snapchat Pixel */}
        {snapchatPixelId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?
              a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];
              var s=t.createElement('script');s.async=!0;s.src=n;
              var u=t.getElementsByTagName('script')[0];u.parentNode.insertBefore(s,u)}
              )(window,document,'https://sc-static.net/scevent.min.js');
              snaptr('init','${snapchatPixelId}',{});snaptr('track','PAGE_VIEW');
            }
          `}</ScriptOnce>
        )}
        {/* Microsoft/Bing UET */}
        {bingUetId && (
          <ScriptOnce>{`
            if (typeof window !== 'undefined') {
              (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:'${bingUetId}',enableAutoSpaTracking:true};
              o.q=w[u],w[u]=new UET(o)},n=d.createElement(t),n.src=r,n.async=1,
              n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=='loaded'&&s!=='complete'||(f(),n.onload=n.onreadystatechange=null)},
              i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)}
              )(window,document,'script','https://bat.bing.com/bat.js','uetq');
            }
          `}</ScriptOnce>
        )}
        {/* Organization JSON-LD -- static, trusted content for SEO structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <CompareProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-main focus:text-main-foreground focus:px-4 focus:py-2 focus:border-2 focus:border-border focus:shadow-shadow focus:font-heading focus:text-sm"
          >
            Skip to main content
          </a>
          <main id="main-content">
            <Outlet />
          </main>
          <CompareBar />
        </CompareProvider>
        <Scripts />
      </body>
    </html>
  );
}
