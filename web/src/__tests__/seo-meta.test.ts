import { describe, expect, it } from "vitest";

import {
  buildCanonicalUrl,
  buildOgMeta,
  buildPageMeta,
} from "@/lib/seo/meta";

describe("buildCanonicalUrl", () => {
  it("returns full URL with SITE_URL prefix", () => {
    const url = buildCanonicalUrl("/scholarships/test");
    expect(url).toMatch(/^https?:\/\/.+\/scholarships\/test$/);
  });

  it("strips query params from path", () => {
    const url = buildCanonicalUrl("/scholarships?page=2&sort=deadline");
    expect(url).not.toContain("?");
    expect(url).toMatch(/\/scholarships$/);
  });
});

describe("buildOgMeta", () => {
  it("returns array of og: and twitter: meta objects", () => {
    const meta = buildOgMeta({
      title: "Test Title",
      description: "Test description",
      url: "https://scholarhub.io/test",
    });

    const ogTitle = meta.find(
      (m: Record<string, string>) => m.property === "og:title",
    );
    expect(ogTitle).toBeDefined();
    expect(ogTitle!.content).toBe("Test Title");

    const ogDesc = meta.find(
      (m: Record<string, string>) => m.property === "og:description",
    );
    expect(ogDesc).toBeDefined();
    expect(ogDesc!.content).toBe("Test description");

    const twitterCard = meta.find(
      (m: Record<string, string>) => m.name === "twitter:card",
    );
    expect(twitterCard).toBeDefined();
    expect(twitterCard!.content).toBe("summary_large_image");

    const twitterTitle = meta.find(
      (m: Record<string, string>) => m.name === "twitter:title",
    );
    expect(twitterTitle).toBeDefined();
    expect(twitterTitle!.content).toBe("Test Title");
  });

  it("includes og:image with default when not provided", () => {
    const meta = buildOgMeta({
      title: "Test",
      description: "Desc",
      url: "https://scholarhub.io",
    });

    const ogImage = meta.find(
      (m: Record<string, string>) => m.property === "og:image",
    );
    expect(ogImage).toBeDefined();
    expect(ogImage!.content).toContain("/api/og");
  });

  it("uses provided image URL", () => {
    const meta = buildOgMeta({
      title: "Test",
      description: "Desc",
      url: "https://scholarhub.io",
      image: "https://example.com/image.png",
    });

    const ogImage = meta.find(
      (m: Record<string, string>) => m.property === "og:image",
    );
    expect(ogImage!.content).toBe("https://example.com/image.png");
  });

  it("defaults og:type to website", () => {
    const meta = buildOgMeta({
      title: "Test",
      description: "Desc",
      url: "https://scholarhub.io",
    });

    const ogType = meta.find(
      (m: Record<string, string>) => m.property === "og:type",
    );
    expect(ogType!.content).toBe("website");
  });
});

describe("buildPageMeta", () => {
  it("returns combined meta and links arrays", () => {
    const result = buildPageMeta({
      title: "Test Page",
      description: "A test page",
      canonicalPath: "/test",
    });

    expect(result.meta).toBeDefined();
    expect(result.links).toBeDefined();
    expect(Array.isArray(result.meta)).toBe(true);
    expect(Array.isArray(result.links)).toBe(true);
  });

  it("includes title and description meta", () => {
    const result = buildPageMeta({
      title: "Test Page",
      description: "A test page",
      canonicalPath: "/test",
    });

    const title = result.meta.find(
      (m: Record<string, string>) => m.title !== undefined,
    );
    expect(title).toBeDefined();

    const desc = result.meta.find(
      (m: Record<string, string>) => m.name === "description",
    );
    expect(desc).toBeDefined();
    expect(desc!.content).toBe("A test page");
  });

  it("includes canonical link", () => {
    const result = buildPageMeta({
      title: "Test",
      description: "Desc",
      canonicalPath: "/scholarships",
    });

    const canonical = result.links.find(
      (l: Record<string, string>) => l.rel === "canonical",
    );
    expect(canonical).toBeDefined();
    expect(canonical!.href).toContain("/scholarships");
  });

  it("includes hreflang link", () => {
    const result = buildPageMeta({
      title: "Test",
      description: "Desc",
      canonicalPath: "/test",
    });

    const hreflang = result.links.find(
      (l: Record<string, string>) => l.hreflang === "en",
    );
    expect(hreflang).toBeDefined();
  });

  it("strips query params from canonical URL", () => {
    const result = buildPageMeta({
      title: "Test",
      description: "Desc",
      canonicalPath: "/scholarships?page=2&sort=deadline",
    });

    const canonical = result.links.find(
      (l: Record<string, string>) => l.rel === "canonical",
    );
    expect(canonical!.href).not.toContain("?");
  });
});
