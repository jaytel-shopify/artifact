"use client";

import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

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
  const [localColumns, setLocalColumns] = useState(columns);

  useEffect(() => {
    onColumnsChange(localColumns);
  }, [localColumns]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground font-medium min-w-[12px]">
        {localColumns}
      </span>
      <div className="w-[120px]">
        <input
          type="range"
          min="1"
          max="8"
          value={localColumns}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocalColumns(Number(e.target.value))
          }
          className="w-full appearance-none"
        />
      </div>

      {/* Fit toggle (only when columns === 1) */}
      {columns === 1 && onFitModeChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Fit</span>
          <Switch checked={fitMode} onCheckedChange={onFitModeChange} />
        </div>
      )}
    </div>
  );
}
