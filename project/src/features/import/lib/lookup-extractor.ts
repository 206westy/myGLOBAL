import type { LookupExtraction } from "./types"

interface ExtractedLookup {
  table: string
  rpcFunction: string
  rows: Record<string, string>[]
}

export function extractLookups(
  csvData: Record<string, string>[],
  extractions: LookupExtraction[]
): ExtractedLookup[] {
  const results: ExtractedLookup[] = []

  for (const extraction of extractions) {
    const seen = new Set<string>()
    const rows: Record<string, string>[] = []

    for (const csvRow of csvData) {
      const code = (csvRow[extraction.codeColumn] ?? "").trim()
      const name = (csvRow[extraction.nameColumn] ?? "").trim()

      if (!code || seen.has(code)) continue
      seen.add(code)

      const row: Record<string, string> = { code, name }

      if (extraction.extraColumns) {
        for (const [dbCol, csvCol] of Object.entries(extraction.extraColumns)) {
          row[dbCol] = (csvRow[csvCol] ?? "").trim()
        }
      }

      // lu_countries: name_ko 매핑
      if (extraction.table === "lu_countries" && !row.name_ko) {
        row.name_ko = name
      }

      rows.push(row)
    }

    if (rows.length > 0) {
      results.push({
        table: extraction.table,
        rpcFunction: extraction.rpcFunction,
        rows,
      })
    }
  }

  return results
}
