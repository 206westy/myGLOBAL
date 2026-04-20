"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useImportStore } from "../hooks/use-import-store"

export function ImportHistoryTable() {
  const { importHistory, setImportHistory } = useImportStore()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("import_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20)
      if (data) setImportHistory(data)
    }
    load()
  }, [setImportHistory])

  if (importHistory.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        임포트 이력
      </h3>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Tcode</th>
              <th className="px-3 py-2 text-left font-medium">파일</th>
              <th className="px-3 py-2 text-right font-medium">행 수</th>
              <th className="px-3 py-2 text-right font-medium">성공</th>
              <th className="px-3 py-2 text-right font-medium">에러</th>
              <th className="px-3 py-2 text-left font-medium">상태</th>
              <th className="px-3 py-2 text-left font-medium">시간</th>
            </tr>
          </thead>
          <tbody>
            {importHistory.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="px-3 py-1.5 font-mono">{log.tcode}</td>
                <td className="px-3 py-1.5 max-w-32 truncate">
                  {log.file_name}
                </td>
                <td className="px-3 py-1.5 text-right font-mono">
                  {log.row_count?.toLocaleString()}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-green-600">
                  {log.success_count?.toLocaleString()}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-red-500">
                  {log.error_count?.toLocaleString()}
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className={
                      log.status === "completed"
                        ? "text-green-600"
                        : log.status === "failed"
                          ? "text-red-500"
                          : "text-yellow-600"
                    }
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {new Date(log.started_at).toLocaleString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
