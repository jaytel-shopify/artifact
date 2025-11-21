"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface ColumnControlProps {
  columns: number;
  onColumnsChange: (columns: number) => void;
  fitMode?: boolean;
  onFitModeChange?: (fit: boolean) => void;
}

export default function ColumnControl({
  columns,
  onColumnsChange,
  fitMode = false,
  onFitModeChange,
}: ColumnControlProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground font-medium min-w-[12px]">
        {columns}
      </span>
      <div className="w-[120px]">
        <Slider
          min={1}
          max={8}
          value={[columns]}
          onValueChange={(value: number[]) => onColumnsChange(value[0] ?? columns)}
          className="w-full"
        />
      </div>

      {/* Fit toggle (only when columns === 1) */}
      {columns === 1 && onFitModeChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Fit
          </span>
          <Switch checked={fitMode} onCheckedChange={onFitModeChange} />
        </div>
      )}
    </div>
  );
}

