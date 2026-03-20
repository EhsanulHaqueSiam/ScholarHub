import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize from current DOM state (set by ScriptOnce in __root.tsx)
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }, []);

  return { isDark, toggle };
}

export function Navbar() {
  const { isDark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed top-0 inset-x-0 z-50",
        "bg-secondary-background border-b-2 border-border shadow-shadow",
        "h-14 md:h-14 flex items-center",
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="font-heading text-xl shrink-0" aria-label="ScholarHub home">
          ScholarHub
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/scholarships"
            className="font-heading text-sm hover:underline underline-offset-4"
            activeProps={{ className: "underline" }}
          >
            Scholarships
          </Link>
          <Link
            to="/scholarships/closing-soon"
            className="font-heading text-sm hover:underline underline-offset-4"
            activeProps={{ className: "underline" }}
          >
            Closing Soon
          </Link>

          {/* Dark mode toggle */}
          <Button
            variant="neutral"
            size="icon"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="shrink-0"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>

        {/* Mobile: dark mode toggle + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="neutral"
            size="icon"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            variant="neutral"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-14 inset-x-0 bg-secondary-background border-b-2 border-border shadow-shadow">
          <div className="flex flex-col px-4 py-3 gap-2">
            <Link
              to="/scholarships"
              className="font-heading text-sm py-2 hover:underline underline-offset-4"
              activeProps={{ className: "underline" }}
              onClick={() => setMenuOpen(false)}
            >
              Scholarships
            </Link>
            <Link
              to="/scholarships/closing-soon"
              className="font-heading text-sm py-2 hover:underline underline-offset-4"
              activeProps={{ className: "underline" }}
              onClick={() => setMenuOpen(false)}
            >
              Closing Soon
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
