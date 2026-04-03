import type { DateHeaderProps } from "react-big-calendar";

export function DayHeader({ label, isOffRange }: DateHeaderProps) {
  return (
    <span className={`text-caption ${isOffRange ? "opacity-40" : ""}`}>
      {label}
    </span>
  );
}
