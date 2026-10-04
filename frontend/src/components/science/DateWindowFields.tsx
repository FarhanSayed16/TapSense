import { Input, Label } from "@/components/ui/Input";

export function DateWindowFields({
  start,
  end,
  onStart,
  onEnd,
  startId = "sci-start",
  endId = "sci-end",
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  startId?: string;
  endId?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={startId}>Start</Label>
        <Input
          id={startId}
          type="date"
          value={start}
          onChange={(e) => onStart(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={endId}>End</Label>
        <Input id={endId} type="date" value={end} onChange={(e) => onEnd(e.target.value)} />
      </div>
    </div>
  );
}
