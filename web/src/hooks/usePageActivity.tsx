import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

function isVisible(): boolean {
  if (typeof document === "undefined") return true;
  if (typeof document.visibilityState === "string") {
    return document.visibilityState === "visible";
  }
  return !document.hidden;
}

function isFocused(): boolean {
  if (typeof document === "undefined") return true;
  return typeof document.hasFocus === "function" ? document.hasFocus() : true;
}

const PageActivityContext = createContext<boolean>(true);

export function PageActivityProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState<boolean>(() => isVisible() && isFocused());

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let focused = isFocused();

    const update = () => {
      const next = isVisible() && focused;
      setIsActive((prev) => (prev === next ? prev : next));
    };

    const onFocus = () => {
      focused = true;
      update();
    };

    const onBlur = () => {
      focused = false;
      update();
    };

    const onVisibilityChange = () => {
      if (isVisible()) {
        focused = isFocused();
      }
      update();
    };

    const onPageShow = () => {
      focused = true;
      update();
    };

    const onPageHide = () => {
      focused = false;
      update();
    };

    window.addEventListener("focus", onFocus, true);
    window.addEventListener("blur", onBlur, true);
    window.addEventListener("pageshow", onPageShow, true);
    window.addEventListener("pagehide", onPageHide, true);
    document.addEventListener("visibilitychange", onVisibilityChange, true);

    update();

    return () => {
      window.removeEventListener("focus", onFocus, true);
      window.removeEventListener("blur", onBlur, true);
      window.removeEventListener("pageshow", onPageShow, true);
      window.removeEventListener("pagehide", onPageHide, true);
      document.removeEventListener("visibilitychange", onVisibilityChange, true);
    };
  }, []);

  return <PageActivityContext.Provider value={isActive}>{children}</PageActivityContext.Provider>;
}

export function usePageActivity(): boolean {
  return useContext(PageActivityContext);
}
