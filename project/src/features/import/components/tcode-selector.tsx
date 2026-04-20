"use client"

import { cn } from "@/lib/utils"
import { TCODE_CONFIGS, TCODE_IMPORT_ORDER } from "../lib/tcode-config"
import type { TcodeKey } from "../lib/types"

interface TcodeSelectorProps {
  selected: TcodeKey | null
  onSelect: (tcode: TcodeKey) => void
  disabled?: boolean
}

export function TcodeSelector({
  selected,
  onSelect,
  disabled,
}: TcodeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Step 1: Tcode 선택
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TCODE_IMPORT_ORDER.map((key) => {
          const config = TCODE_CONFIGS[key]
          const isSelected = selected === key
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              disabled={disabled}
              className={cn(
                "rounded-lg border-2 p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              <div className="font-mono text-sm font-semibold">
                {config.tcode}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {config.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
