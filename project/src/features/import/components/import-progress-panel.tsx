"use client"

import { cn } from "@/lib/utils"
import type { ImportPhase } from "../lib/types"

interface ImportProgressPanelProps {
  phase: ImportPhase | null
  progress: {
    current: number
    total: number
    successCount: number
    errorCount: number
  }
  startTime: number | null
}

const PHASE_LABELS: Record<ImportPhase, string> = {
  parsing: "CSV 파싱 중...",
  lookup_extraction: "룩업 테이블 추출 중...",
  importing: "데이터 임포트 중...",
  refreshing_views: "집계 뷰 갱신 중...",
  complete: "완료",
  error: "오류 발생",
}

export function ImportProgressPanel({
  phase,
  progress,
  startTime,
}: ImportProgressPanelProps) {
  if (!phase) return null

  const pct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
  const eta =
    phase === "importing" && pct > 0
      ? Math.round((elapsed / pct) * (100 - pct))
      : null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Step 4: 임포트 진행
      </h3>
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {PHASE_LABELS[phase]}
          </span>
          <span className="text-xs text-muted-foreground">
            {elapsed}s
            {eta !== null && ` / ETA ~${eta}s`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              phase === "error" ? "bg-red-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">진행: </span>
            <span className="font-mono">
              {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">성공: </span>
            <span className="font-mono text-green-600">
              {progress.successCount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">에러: </span>
            <span className={cn("font-mono", progress.errorCount > 0 && "text-red-500")}>
              {progress.errorCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
