"use client"

import { useCallback, useRef, useState } from "react"
import { useImportStore } from "../hooks/use-import-store"
import { getTcodeConfig } from "../lib/tcode-config"
import { startImport } from "../lib/import-client"
import { TcodeSelector } from "./tcode-selector"
import { CsvUploader } from "./csv-uploader"
import { ImportProgressPanel } from "./import-progress-panel"
import { ErrorLogPanel } from "./error-log-panel"
import { ImportHistoryTable } from "./import-history-table"
import type { TcodeKey, ImportEvent } from "../lib/types"

export function ImportPage() {
  const selectedTcode = useImportStore((s) => s.selectedTcode)
  const phase = useImportStore((s) => s.phase)
  const progress = useImportStore((s) => s.progress)
  const errors = useImportStore((s) => s.errors)
  const isImporting = useImportStore((s) => s.isImporting)

  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const config = selectedTcode ? getTcodeConfig(selectedTcode) : null

  const handleTcodeSelect = useCallback((tcode: TcodeKey) => {
    useImportStore.getState().reset()
    useImportStore.getState().setTcode(tcode)
    setFilePath(null)
    setFileName(null)
  }, [])

  const handleFileReady = useCallback((path: string, name: string) => {
    setFilePath(path)
    setFileName(name)
  }, [])

  const handleImport = useCallback(async () => {
    const s = useImportStore.getState()
    if (!s.selectedTcode || !filePath) return

    s.setIsImporting(true)
    s.setPhase("parsing")
    startTimeRef.current = Date.now()

    await startImport(s.selectedTcode, filePath, (event: ImportEvent) => {
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
  }, [filePath])

  const canImport = selectedTcode && filePath && !isImporting

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SAP mySERVICE CSV 데이터를 PostgreSQL에 임포트합니다
        </p>
      </div>

      <TcodeSelector
        selected={selectedTcode}
        onSelect={handleTcodeSelect}
        disabled={isImporting}
      />

      {selectedTcode && (
        <CsvUploader
          onFileReady={handleFileReady}
          disabled={isImporting}
        />
      )}

      {filePath && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <span className="text-muted-foreground">선택된 파일: </span>
          <strong className="font-mono">{filePath}</strong>
        </div>
      )}

      {canImport && (
        <button
          onClick={handleImport}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Import 시작 → {config?.targetTable}
        </button>
      )}

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
