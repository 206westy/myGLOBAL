"use client"

import { useState } from "react"
import type { TcodeConfig } from "../lib/types"

interface ColumnMappingPreviewProps {
  config: TcodeConfig
  csvColumns: string[]
}

export function ColumnMappingPreview({
  config,
  csvColumns,
}: ColumnMappingPreviewProps) {
  const [expanded, setExpanded] = useState(false)

  const entries = Object.entries(config.csvHeaderMap).filter(
    ([, dbCol]) => !dbCol.startsWith("_")
  )
  const displayEntries = expanded ? entries : entries.slice(0, 10)
  const matchedCount = entries.filter(([csvH]) =>
    csvColumns.includes(csvH)
  ).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Step 3: 컬럼 매핑 확인
        </h3>
        <span className="text-xs text-muted-foreground">
          매칭: {matchedCount}/{entries.length}
        </span>
      </div>
      <div className="rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">CSV 컬럼</th>
              <th className="px-3 py-2 text-left font-medium">DB 컬럼</th>
              <th className="px-3 py-2 text-left font-medium">변환</th>
              <th className="px-3 py-2 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map(([csvH, dbCol]) => {
              const matched = csvColumns.includes(csvH)
              const transform = config.transformations[dbCol]
              return (
                <tr key={csvH} className="border-b last:border-0">
                  <td className="px-3 py-1.5 font-mono">{csvH}</td>
                  <td className="px-3 py-1.5 font-mono text-primary">
                    {dbCol}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {transform ?? "-"}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {matched ? (
                      <span className="text-green-600">OK</span>
                    ) : (
                      <span className="text-red-500">Missing</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {entries.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full border-t px-3 py-2 text-center text-xs text-muted-foreground hover:bg-muted/50"
          >
            {expanded
              ? "접기"
              : `나머지 ${entries.length - 10}개 더보기`}
          </button>
        )}
      </div>
    </div>
  )
}
