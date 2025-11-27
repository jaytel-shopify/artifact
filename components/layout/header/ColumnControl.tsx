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
    <div className="flex items-center gap-3 bg-primary rounded-button border border-border">
      <div className="relative h-10 w-64">
        <div className="absolute top-0 left-0 size-full flex items-center justify-between pointer-events-none px-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="dot-indicator w-2 h-2 bg-primary/20 rounded-full"
            ></div>
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="8"
          value={localColumns}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocalColumns(Number(e.target.value))
          }
          className="relative w-full appearance-none"
        />
        <span
          className="absolute pointer-events-none top-1/2 left-1 w-8 z-10 text-xs text-white font-medium min-w-[12px] text-center translate-y-[-50%]"
          style={{
            transform: `translateX(${(localColumns - 1) * 96.5}%)`,
          }}
        >
          {localColumns}
        </span>
      </div>

      {/* Fit toggle (only when columns === 1) */}
      {/* {columns === 1 && onFitModeChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">Fit</span>
          <Switch checked={fitMode} onCheckedChange={onFitModeChange} />
        </div>
      )} */}
    </div>
  );
}
