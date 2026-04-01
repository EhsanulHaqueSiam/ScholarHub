/** Global type declarations for tracking pixel SDKs injected via ScriptOnce. */

interface Window {
  // Google Analytics 4
  gtag: ((...args: any[]) => void) | undefined;
  dataLayer: any[] | undefined;

  // Meta/Facebook Pixel
  fbq: ((...args: any[]) => void) | undefined;

  // TikTok Pixel
  ttq: { page: () => void; track: (...args: any[]) => void } | undefined;

  // Twitter/X Pixel
  twq: ((...args: any[]) => void) | undefined;

  // LinkedIn Insight Tag
  lintrk: ((...args: any[]) => void) | undefined;

  // Pinterest Tag
  pintrk: ((...args: any[]) => void) | undefined;

  // Snapchat Pixel
  snaptr: ((...args: any[]) => void) | undefined;

  // Bing UET
  uetq: any[] | undefined;

  // Microsoft Clarity
  clarity: ((...args: any[]) => void) | undefined;
}
