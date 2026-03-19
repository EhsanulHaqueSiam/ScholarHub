import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";

export const Route = createFileRoute("/")({
  component: HomePage,
});

export function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[480px] bg-secondary-background">
        <CardContent className="p-8 text-center space-y-6">
          <Badge>Coming Soon</Badge>
          <h1 className="font-heading text-[32px] md:text-[48px] leading-[1.1] text-foreground">
            ScholarHub
          </h1>
          <h2 className="font-heading text-xl leading-[1.2] text-foreground">
            Find your scholarship. Fund your future.
          </h2>
          <p className="font-base text-base leading-[1.5] text-foreground">
            We are building the most comprehensive international scholarship directory. Every
            scholarship. Every country. One place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
