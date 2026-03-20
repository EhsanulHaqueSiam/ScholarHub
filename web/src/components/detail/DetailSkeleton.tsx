import { Card, CardContent } from "@/components/ui/card";

export function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6">
      <div className="space-y-8">
        {/* Hero skeleton */}
        <Card className="motion-safe:animate-pulse">
          <CardContent className="p-6 md:p-8 space-y-4">
            {/* Badge row placeholder */}
            <div className="flex gap-2">
              <div className="h-6 bg-border/20 rounded-base w-16" />
              <div className="h-6 bg-border/20 rounded-base w-20" />
            </div>
            {/* Title placeholder */}
            <div className="h-8 bg-border/20 rounded-base w-3/4" />
            {/* Provider placeholder */}
            <div className="h-5 bg-border/20 rounded-base w-1/2" />
            {/* Button placeholder */}
            <div className="h-11 bg-border/20 rounded-base w-full md:w-40" />
          </CardContent>
        </Card>

        {/* Section skeletons */}
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="motion-safe:animate-pulse">
            <CardContent className="p-6 md:p-8 space-y-4">
              {/* Section title */}
              <div className="h-6 bg-border/20 rounded-base w-1/3" />
              {/* Content bars */}
              <div className="h-4 bg-border/20 rounded-base w-full" />
              <div className="h-4 bg-border/20 rounded-base w-5/6" />
              <div className="h-4 bg-border/20 rounded-base w-2/3" />
              {i % 2 === 0 && (
                <div className="h-4 bg-border/20 rounded-base w-3/4" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
