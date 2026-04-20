import { createServiceClient } from "@/lib/supabase/server"
import { getTcodeConfig } from "@/features/import/lib/tcode-config"
import { transformRow, unpivotMetricsRow } from "@/features/import/lib/csv-transforms"
import { extractLookups } from "@/features/import/lib/lookup-extractor"
import type { ImportEvent, ImportError, TcodeKey } from "@/features/import/lib/types"
import Papa from "papaparse"
import { readFileSync } from "fs"
import { resolve } from "path"

const CHUNK_SIZE = 2000

// 프로젝트 루트에서 상대 경로로 파일을 찾기 위한 베이스
const PROJECT_ROOT = resolve(process.cwd(), "..")

export async function POST(request: Request) {
  const body = await request.json()
  const { tcode, filePath } = body as { tcode: TcodeKey; filePath: string }

  if (!tcode || !filePath) {
    return new Response("Missing tcode or filePath", { status: 400 })
  }

  const config = getTcodeConfig(tcode)
  if (!config) {
    return new Response(`Unknown tcode: ${tcode}`, { status: 400 })
  }

  // 파일 읽기 (프로젝트 루트 기준 상대 경로)
  let csvText: string
  const fullPath = resolve(PROJECT_ROOT, filePath)
  try {
    csvText = readFileSync(fullPath, "utf-8").replace(/^\uFEFF/, "")
  } catch (err) {
    return new Response(`파일을 찾을 수 없습니다: ${fullPath}`, { status: 404 })
  }

  const fileName = filePath.split("/").pop() ?? filePath
  const supabase = createServiceClient()
  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: ImportEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // Phase 1: Parse CSV
        send({ type: "phase", phase: "parsing" })
        const parsed = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.replace(/\u00A0/g, " ").trim(),
        })
        const csvData = parsed.data

        // Phase 2: Extract & upsert lookup tables
        send({ type: "phase", phase: "lookup_extraction" })
        const lookups = extractLookups(csvData, config.lookupExtractions)
        for (const lookup of lookups) {
          // upsert_lookup_batch와 upsert_lookup_with_group_batch만 p_table 필요
          const needsTable = lookup.rpcFunction === "upsert_lookup_batch" || lookup.rpcFunction === "upsert_lookup_with_group_batch"
          const params = needsTable
            ? { p_table: lookup.table, p_rows: lookup.rows }
            : { p_rows: lookup.rows }
          const { error: lookupErr } = await supabase.rpc(lookup.rpcFunction, params as Record<string, unknown>)
          if (lookupErr) {
            console.error(`Lookup ${lookup.table} error:`, lookupErr.message)
          }
        }

        // Phase 3: Transform rows
        send({ type: "phase", phase: "importing" })

        let transformedRows: Record<string, unknown>[]

        if (config.isUnpivot && config.unpivotConfig) {
          const fixedMap: Record<string, string> = {}
          for (const [csvH, dbC] of Object.entries(config.csvHeaderMap)) {
            fixedMap[csvH] = dbC
          }

          transformedRows = []
          for (const csvRow of csvData) {
            const unpivoted = unpivotMetricsRow(
              csvRow,
              fixedMap,
              config.unpivotConfig.divisionColumn,
              config.unpivotConfig.monthColumnPattern
            )
            for (const u of unpivoted) {
              transformedRows.push({
                ...u.fixedData,
                year_month: u.year_month,
                division: u.division,
                value: u.value,
              })
            }
          }
        } else {
          transformedRows = csvData.map((row) => {
            const mapped = transformRow(row, config.csvHeaderMap, config.transformations)
            const filtered: Record<string, unknown> = {}
            for (const [key, val] of Object.entries(mapped)) {
              if (!key.startsWith("_")) {
                filtered[key] = val
              }
            }
            return filtered
          })
        }

        // Phase 4: Chunk and upsert
        const totalRows = transformedRows.length
        const totalChunks = Math.ceil(totalRows / CHUNK_SIZE)
        let successCount = 0
        let errorCount = 0
        const allErrors: ImportError[] = []

        for (let i = 0; i < totalChunks; i++) {
          const chunk = transformedRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
          const chunkErrors: ImportError[] = []

          try {
            const { data, error } = await supabase.rpc(config.rpcFunction, {
              p_rows: chunk,
            })

            if (error) throw new Error(error.message ?? JSON.stringify(error))

            const result = data as { success_count: number; error_count: number; errors: Array<{ row?: number; error: string }> }
            successCount += result.success_count
            errorCount += result.error_count

            for (const e of result.errors ?? []) {
              const importError: ImportError = {
                row: (i * CHUNK_SIZE) + (e.row ?? 0),
                message: e.error,
              }
              chunkErrors.push(importError)
              allErrors.push(importError)
            }
          } catch (chunkErr) {
            // Chunk-level failure: row-by-row retry
            for (let j = 0; j < chunk.length; j++) {
              try {
                const { data, error } = await supabase.rpc(config.rpcFunction, {
                  p_rows: [chunk[j]],
                })

                if (error) throw error

                const result = data as { success_count: number; error_count: number; errors: Array<{ error: string }> }
                if (result.error_count > 0) {
                  const importError: ImportError = {
                    row: i * CHUNK_SIZE + j + 1,
                    message: result.errors?.[0]?.error ?? "Unknown error",
                  }
                  chunkErrors.push(importError)
                  allErrors.push(importError)
                  errorCount++
                } else {
                  successCount++
                }
              } catch (rowErr) {
                const importError: ImportError = {
                  row: i * CHUNK_SIZE + j + 1,
                  message: rowErr instanceof Error ? rowErr.message : String(rowErr),
                }
                chunkErrors.push(importError)
                allErrors.push(importError)
                errorCount++
              }
            }
          }

          send({
            type: "chunk_done",
            chunkIndex: i,
            totalChunks,
            rowsInChunk: chunk.length,
            errors: chunkErrors,
          })

          send({
            type: "progress",
            current: Math.min((i + 1) * CHUNK_SIZE, totalRows),
            total: totalRows,
            successCount,
            errorCount,
          })
        }

        // Phase 5: Refresh MVs
        send({ type: "phase", phase: "refreshing_views" })
        await supabase.rpc("refresh_all_materialized_views")

        // Phase 6: Log import
        const durationMs = Date.now() - startTime
        await supabase.from("import_logs").insert({
          tcode: config.tcode,
          file_name: fileName,
          row_count: totalRows,
          success_count: successCount,
          error_count: errorCount,
          errors: allErrors.length > 0 ? allErrors.slice(0, 100) : null,
          status: errorCount === totalRows ? "failed" : "completed",
          completed_at: new Date().toISOString(),
        })

        send({
          type: "complete",
          summary: {
            tcode: config.tcode,
            fileName,
            totalRows,
            successCount,
            errorCount,
            durationMs,
            errors: allErrors.slice(0, 100),
          },
        })
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
