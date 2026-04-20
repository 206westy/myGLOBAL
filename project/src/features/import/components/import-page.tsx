"use client"

import { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useImportStore } from "../hooks/use-import-store"
import { getTcodeConfig, TCODE_IMPORT_ORDER } from "../lib/tcode-config"
import { startImport } from "../lib/import-client"
import { ImportProgressPanel } from "./import-progress-panel"
import { ErrorLogPanel } from "./error-log-panel"
import { ImportHistoryTable } from "./import-history-table"
import type { TcodeKey, ImportEvent } from "../lib/types"

const TCODE_CSV_MAP: Record<TcodeKey, { file: string; label: string }> = {
  ZCSR0010: { file: "Database/SAP/ZCSR0010.csv", label: "장비마스터" },
  ZCSR0070D_INSTALL: { file: "Database/SAP/ZCSR0070D_INSTALL.csv", label: "셋업오더" },
  ZCSR0070D: { file: "Database/SAP/ZCSR0070D_MAINT.csv", label: "서비스오더" },
  ZCSR0140D: { file: "Database/SAP/ZCSR0140D.csv", label: "태스크상세" },
  ZCSR0100: { file: "Database/SAP/ZCSR0100.csv", label: "파트사용이력" },
  ZCSR0150: { file: "Database/SAP/ZCSR0150.csv", label: "월별가동이력" },
  ZCSR0210: { file: "Database/SAP/ZCSR0210.csv", label: "인원마스터" },
  ZSDR0030D: { file: "Database/SAP/ZSDR0030D.csv", label: "해외FCST" },
  ZSDR0040D: { file: "Database/SAP/ZSDR0040D.csv", label: "국내FCST" },
  BRANCH: { file: "Database/SAP/branch.csv", label: "브랜치" },
}

export function ImportPage() {
  const selectedTcode = useImportStore((s) => s.selectedTcode)
  const phase = useImportStore((s) => s.phase)
  const progress = useImportStore((s) => s.progress)
  const errors = useImportStore((s) => s.errors)
  const isImporting = useImportStore((s) => s.isImporting)

  const startTimeRef = useRef<number | null>(null)

  const handleImport = useCallback(async (tcode: TcodeKey) => {
    const s = useImportStore.getState()
    const csv = TCODE_CSV_MAP[tcode]

    s.reset()
    s.setTcode(tcode)
    s.setIsImporting(true)
    s.setPhase("parsing")
    startTimeRef.current = Date.now()

    await startImport(tcode, csv.file, (event: ImportEvent) => {
      const st = useImportStore.getState()
      switch (event.type) {
        case "phase":
          st.setPhase(event.phase)
          break
        case "progress":
          st.setProgress({
            current: event.current,
            total: event.total,
            successCount: event.successCount,
            errorCount: event.errorCount,
          })
          break
        case "chunk_done":
          if (event.errors.length > 0) st.addErrors(event.errors)
          break
        case "error":
          st.setPhase("error")
          st.addErrors([{ row: event.row ?? 0, message: event.message }])
          break
        case "complete":
          st.setPhase("complete")
          st.setProgress({
            current: event.summary.totalRows,
            total: event.summary.totalRows,
            successCount: event.summary.successCount,
            errorCount: event.summary.errorCount,
          })
          break
      }
    })

    useImportStore.getState().setIsImporting(false)
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SAP mySERVICE CSV 데이터를 PostgreSQL에 임포트합니다. 순서대로 실행하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TCODE_IMPORT_ORDER.map((tcode, idx) => {
          const config = getTcodeConfig(tcode)
          const csv = TCODE_CSV_MAP[tcode]
          const isRunning = isImporting && selectedTcode === tcode
          const isDone = selectedTcode === tcode && phase === "complete"
          const isError = selectedTcode === tcode && phase === "error"

          return (
            <button
              key={tcode}
              onClick={() => handleImport(tcode)}
              disabled={isImporting}
              className={cn(
                "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isRunning && "border-yellow-500 bg-yellow-500/5 animate-pulse",
                isDone && "border-green-500 bg-green-500/5",
                isError && "border-red-500 bg-red-500/5",
                !isRunning && !isDone && !isError && "border-border bg-card",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-semibold">
                  {config.tcode}
                  <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                    {csv.label}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
                  {csv.file}
                </div>
                {isRunning && phase && (
                  <div className="mt-1 text-xs font-medium text-yellow-600">
                    {phase}...
                  </div>
                )}
                {isDone && (
                  <div className="mt-1 text-xs font-medium text-green-600">
                    {progress.successCount.toLocaleString()} rows OK
                    {progress.errorCount > 0 && `, ${progress.errorCount} errors`}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <ImportProgressPanel
        phase={phase}
        progress={progress}
        startTime={startTimeRef.current}
      />

      <ErrorLogPanel errors={errors} />

      <ImportHistoryTable />
    </div>
  )
}
