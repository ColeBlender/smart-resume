"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RATING_LABELS, type Rating } from "@/lib/scoring";

const RATINGS: Rating[] = [1, 2, 3, 4, 5];

export function RatingPicker({
  value,
  onChange,
}: {
  value: Rating | undefined;
  onChange: (rating: Rating) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value ? String(value) : ""}
      onValueChange={(v) => v && onChange(Number(v) as Rating)}
    >
      {RATINGS.map((r) => (
        <ToggleGroupItem key={r} value={String(r)} aria-label={`${r}: ${RATING_LABELS[r]}`} title={RATING_LABELS[r]}>
          {r}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** The legend shown above any list of rating pickers. */
export function RatingLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      {RATINGS.map((r) => `${r} ${RATING_LABELS[r].toLowerCase()}`).join(" · ")}
    </p>
  );
}
