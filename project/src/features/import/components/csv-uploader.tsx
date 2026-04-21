"use client"

import { useState } from "react"

interface CsvUploaderProps {
  onFileReady: (filePath: string, fileName: string) => void
  disabled?: boolean
}

const PRESET_FILES = [
  { label: "ZCSR0010.csv (장비마스터)", path: "Database/SAP/ZCSR0010.csv" },
  { label: "ZCSR0070D_INSTALL.csv (셋업오더)", path: "Database/SAP/ZCSR0070D_INSTALL.csv" },
  { label: "ZCSR0070D_MAINT.csv (서비스오더)", path: "Database/SAP/ZCSR0070D_MAINT.csv" },
  { label: "ZCSR0140D.csv (태스크상세)", path: "Database/SAP/ZCSR0140D.csv" },
  { label: "ZCSR0100.csv (파트사용이력)", path: "Database/SAP/ZCSR0100.csv" },
  { label: "ZCSR0150.csv (월별가동이력)", path: "Database/SAP/ZCSR0150.csv" },
  { label: "ZCSR0210.csv (인원마스터)", path: "Database/SAP/ZCSR0210.csv" },
  { label: "ZSDR0030D.csv (해외FCST)", path: "Database/SAP/ZSDR0030D.csv" },
  { label: "ZSDR0040D.csv (국내FCST)", path: "Database/SAP/ZSDR0040D.csv" },
  { label: "branch.csv (브랜치)", path: "Database/SAP/branch.csv" },
]

export function CsvUploader({ onFileReady, disabled }: CsvUploaderProps) {
  const [customPath, setCustomPath] = useState("")

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Step 2: CSV 파일 선택
      </h3>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          프리셋 파일 (프로젝트 루트 기준)
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_FILES.map((f) => (
            <button
              key={f.path}
              type="button"
              disabled={disabled}
              onClick={() => onFileReady(f.path, f.path.split("/").pop()!)}
              className="rounded-md border bg-card px-3 py-1.5 text-xs font-mono hover:bg-accent hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <input
            type="text"
            placeholder="또는 파일 경로 직접 입력 (예: Database/SAP/ZCSR0010.csv)"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            disabled={disabled}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={disabled || !customPath.trim()}
            onClick={() =>
              onFileReady(customPath.trim(), customPath.trim().split("/").pop()!)
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
