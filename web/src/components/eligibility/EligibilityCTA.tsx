import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EligibilityCTAProps {
  size?: "default" | "lg";
  className?: string;
}

export function EligibilityCTA({ size = "lg", className }: EligibilityCTAProps) {
  return (
    <Link to="/eligibility">
      <Button variant="accent" size={size} className={className}>
        <Sparkles className="size-4 mr-2" />
        Check Your Eligibility
      </Button>
    </Link>
  );
}
