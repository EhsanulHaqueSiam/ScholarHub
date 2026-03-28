import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <>
      {/* Desktop-only guard: per UI-SPEC min 1024px */}
      <div className="lg:hidden flex items-center justify-center min-h-screen p-8">
        <p className="text-center text-foreground font-base text-sm">
          Admin dashboard requires a desktop browser (1024px minimum).
        </p>
      </div>

      <div className="hidden lg:flex flex-col min-h-screen bg-background">
        <AdminHeader />
        <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-6">
          <Outlet />
        </div>
      </div>
    </>
  );
}

function AdminHeader() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <header className="h-16 bg-secondary-background border-b-4 border-border shadow-[0_6px_0_0_var(--border)] flex items-center justify-between px-6">
      <span className="font-heading text-xl text-foreground">
        ScholarHub <span className="text-accent">Admin</span>
      </span>
      <Button
        variant="neutral"
        size="icon"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="size-9"
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}
