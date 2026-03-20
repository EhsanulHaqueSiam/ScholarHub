import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card prestige="unranked" className="h-[320px] motion-safe:animate-pulse">
      <CardHeader>
        <div className="h-5 bg-border/20 rounded-base w-3/4" />
        <div className="h-4 bg-border/20 rounded-base w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-border/20 rounded-base w-16" />
          <div className="h-5 bg-border/20 rounded-base w-20" />
          <div className="h-5 bg-border/20 rounded-base w-14" />
        </div>
        <div className="h-4 bg-border/20 rounded-base w-full" />
        <div className="h-4 bg-border/20 rounded-base w-2/3" />
      </CardContent>
      <CardContent>
        <div className="flex gap-1">
          <div className="h-5 bg-border/20 rounded-base w-12" />
          <div className="h-5 bg-border/20 rounded-base w-12" />
        </div>
      </CardContent>
      <CardContent className="mt-auto">
        <div className="h-8 bg-border/20 rounded-base w-24 ms-auto" />
      </CardContent>
    </Card>
  );
}
