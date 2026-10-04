import { Info } from "lucide-react";

export function HonestyBanner({
  text,
  sampleHint,
}: {
  text?: string | null;
  sampleHint?: string | null;
}) {
  return (
    <div className="callout flex items-start gap-3 text-sm text-ink-secondary">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
      <div>
        <p>{text || "Pilot N is small — treat deltas as descriptive, not powered causal proof."}</p>
        {sampleHint ? <p className="mt-1 text-xs text-muted">{sampleHint}</p> : null}
      </div>
    </div>
  );
}
