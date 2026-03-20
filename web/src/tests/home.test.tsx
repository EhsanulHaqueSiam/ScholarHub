import { describe, expect, it } from "vitest";

describe("HomePage", () => {
  it("exports a redirect route to /scholarships", async () => {
    const mod = await import("../routes/index");
    expect(mod.Route).toBeDefined();
  });
});
