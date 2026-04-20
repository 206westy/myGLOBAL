"use client"

import { useState } from "react"
import type { ImportError } from "../lib/types"

interface ErrorLogPanelProps {
  errors: ImportError[]
}

export function ErrorLogPanel({ errors }: ErrorLogPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (errors.length === 0) return null

  const displayErrors = expanded ? errors : errors.slice(0, 10)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"
      >
        Error Log ({errors.length}건)
        <span className="text-xs">
          {expanded ? "▲ 접기" : "▼ 펼치기"}
        </span>
      </button>
      {(expanded || errors.length <= 10) && (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-1.5 text-left font-medium w-16">행</th>
                <th className="px-3 py-1.5 text-left font-medium">에러 메시지</th>
              </tr>
            </thead>
            <tbody>
              {displayErrors.map((err, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-1 font-mono">{err.row}</td>
                  <td className="px-3 py-1 text-red-700 dark:text-red-400 break-all">
                    {err.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!expanded && errors.length > 10 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full border-t px-3 py-1.5 text-center text-xs text-muted-foreground hover:bg-muted/30"
            >
              나머지 {errors.length - 10}건 더보기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
