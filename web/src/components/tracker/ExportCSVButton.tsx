import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTrackerStore } from "@/hooks/useTrackerStore";
import { generateCSV, downloadCSV } from "@/lib/tracker/tracker-csv";

export function ExportCSVButton() {
  const entries = useTrackerStore((s) => s.entries);

  const handleExport = () => {
    const csv = generateCSV(entries);
    downloadCSV(csv);
    toast.success("CSV exported");
  };

  return (
    <Button
      variant="neutral"
      size="sm"
      onClick={handleExport}
      disabled={entries.length === 0}
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
