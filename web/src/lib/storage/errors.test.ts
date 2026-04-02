import { describe, expect, it } from "vitest";
import {
  classifyStorageError,
  isQuotaExceededError,
  isSecurityError,
} from "./errors";

describe("isQuotaExceededError", () => {
  it("returns true for DOMException with code 22 (Chrome)", () => {
    const err = new DOMException("Quota exceeded", "QuotaExceededError");
    // Chrome sets code 22
    Object.defineProperty(err, "code", { value: 22 });
    expect(isQuotaExceededError(err)).toBe(true);
  });

  it("returns true for DOMException with name 'QuotaExceededError'", () => {
    const err = new DOMException("Quota exceeded", "QuotaExceededError");
    expect(isQuotaExceededError(err)).toBe(true);
  });

  it("returns true for DOMException with code 1014 (Firefox)", () => {
    const err = new DOMException("Quota exceeded", "UnknownError");
    Object.defineProperty(err, "code", { value: 1014 });
    expect(isQuotaExceededError(err)).toBe(true);
  });

  it("returns true for DOMException with name 'NS_ERROR_DOM_QUOTA_REACHED'", () => {
    const err = new DOMException("Quota exceeded", "UnknownError");
    Object.defineProperty(err, "name", { value: "NS_ERROR_DOM_QUOTA_REACHED" });
    expect(isQuotaExceededError(err)).toBe(true);
  });

  it("returns false for a regular Error", () => {
    expect(isQuotaExceededError(new Error("some error"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isQuotaExceededError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isQuotaExceededError(undefined)).toBe(false);
  });

  it("returns false for a non-object (string)", () => {
    expect(isQuotaExceededError("error")).toBe(false);
  });

  it("returns false for a non-object (number)", () => {
    expect(isQuotaExceededError(42)).toBe(false);
  });
});

describe("isSecurityError", () => {
  it("returns true for DOMException with name 'SecurityError'", () => {
    const err = new DOMException("Security error", "SecurityError");
    expect(isSecurityError(err)).toBe(true);
  });

  it("returns false for a regular Error", () => {
    expect(isSecurityError(new Error("not security"))).toBe(false);
  });

  it("returns false for a DOMException with a different name", () => {
    const err = new DOMException("Not found", "NotFoundError");
    expect(isSecurityError(err)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSecurityError(null)).toBe(false);
  });
});

describe("classifyStorageError", () => {
  it("returns 'quota_exceeded' for QuotaExceededError", () => {
    const err = new DOMException("Quota exceeded", "QuotaExceededError");
    expect(classifyStorageError(err)).toBe("quota_exceeded");
  });

  it("returns 'security_error' for SecurityError", () => {
    const err = new DOMException("Security error", "SecurityError");
    expect(classifyStorageError(err)).toBe("security_error");
  });

  it("returns 'not_supported' for a regular Error", () => {
    expect(classifyStorageError(new Error("unknown"))).toBe("not_supported");
  });

  it("returns 'not_supported' for null", () => {
    expect(classifyStorageError(null)).toBe("not_supported");
  });

  it("returns 'quota_exceeded' for Firefox code 1014", () => {
    const err = new DOMException("Quota exceeded", "UnknownError");
    Object.defineProperty(err, "code", { value: 1014 });
    expect(classifyStorageError(err)).toBe("quota_exceeded");
  });
});
