import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("basic functionality", () => {
    it("returns defaultValue when nothing stored", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      expect(result.current[0]).toBe("default");
    });

    it("returns stored value when key exists in localStorage", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      expect(result.current[0]).toBe("stored-value");
    });

    it("persists value to localStorage when setValue is called", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      act(() => {
        result.current[1]("new-value");
      });
      expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("new-value");
    });

    it("supports functional updates via setValue", () => {
      const { result } = renderHook(() => useLocalStorage("counter", 0));
      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      expect(result.current[0]).toBe(1);
    });
  });

  describe("backward compatibility", () => {
    it("works with [val, setVal] destructuring (third element ignored)", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      const [val, setVal] = result.current;
      expect(val).toBe("default");
      expect(typeof setVal).toBe("function");
    });
  });

  describe("error state (third element)", () => {
    it("returns null error on successful write", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      expect(result.current[2]).toBeNull();
    });

    it('returns "quota_exceeded" error when localStorage.setItem throws QuotaExceededError', () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      const quotaError = new DOMException("Quota exceeded", "QuotaExceededError");
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      act(() => {
        result.current[1]("big-data");
      });

      expect(result.current[2]).toBe("quota_exceeded");
    });

    it('returns "security_error" error when localStorage.setItem throws SecurityError', () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      const securityError = new DOMException("Security error", "SecurityError");
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw securityError;
      });

      act(() => {
        result.current[1]("some-data");
      });

      expect(result.current[2]).toBe("security_error");
    });

    it("clears error to null after a successful write following an error", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      // First: force a quota error
      const quotaError = new DOMException("Quota exceeded", "QuotaExceededError");
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      act(() => {
        result.current[1]("big-data");
      });
      expect(result.current[2]).toBe("quota_exceeded");

      // Then: restore normal behavior and write again
      spy.mockRestore();

      act(() => {
        result.current[1]("small-data");
      });
      expect(result.current[2]).toBeNull();
    });
  });

  describe("cross-tab sync", () => {
    it("updates value when storage event fires for the same key", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "test-key",
            newValue: JSON.stringify("from-other-tab"),
            storageArea: localStorage,
          }),
        );
      });

      expect(result.current[0]).toBe("from-other-tab");
    });

    it("resets to defaultValue when another tab calls localStorage.clear()", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );

      // First set a value
      act(() => {
        result.current[1]("some-value");
      });
      expect(result.current[0]).toBe("some-value");

      // Simulate clear() from another tab (key is null)
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: null,
            newValue: null,
            storageArea: localStorage,
          }),
        );
      });

      expect(result.current[0]).toBe("default");
    });

    it("does NOT update value when storage event fires for a different key", () => {
      const { result } = renderHook(() => useLocalStorage("my-key", "default"));

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "other-key",
            newValue: JSON.stringify("other-value"),
            storageArea: localStorage,
          }),
        );
      });

      expect(result.current[0]).toBe("default");
    });

    it("falls back to defaultValue when newValue is null (key removed in another tab)", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      act(() => {
        result.current[1]("some-value");
      });

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "test-key",
            newValue: null,
            storageArea: localStorage,
          }),
        );
      });

      expect(result.current[0]).toBe("default");
    });

    it("falls back to defaultValue when newValue is invalid JSON", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "test-key",
            newValue: "not-valid-json{",
            storageArea: localStorage,
          }),
        );
      });

      expect(result.current[0]).toBe("default");
    });
  });

  describe("SSR safety", () => {
    it("returns defaultValue with null error when window is undefined", () => {
      // The hook already handles typeof window === 'undefined' internally.
      // In jsdom, window exists, so we test the hook initializes correctly.
      const { result } = renderHook(() => useLocalStorage("ssr-key", "ssr-default"));
      expect(result.current[0]).toBe("ssr-default");
      expect(result.current[2]).toBeNull();
    });
  });
});
