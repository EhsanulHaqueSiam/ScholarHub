import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-base">
      <h1 className="font-heading text-4xl">ScholarHub</h1>
    </div>
  );
}
