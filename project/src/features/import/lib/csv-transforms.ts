import type { TransformType } from "./types"

export function convertKoreanTime(value: string): string | null {
  if (!value || value.trim() === "") return null
  const trimmed = value.trim()

  const match = trimmed.match(/^(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) return trimmed

  const [, period, hourStr, min, sec] = match
  let hour = parseInt(hourStr, 10)

  if (period === "오후" && hour < 12) hour += 12
  if (period === "오전" && hour === 12) hour = 0

  return `${String(hour).padStart(2, "0")}:${min}:${sec}`
}

export function stripCommaNumber(value: string): number | null {
  if (!value || value.trim() === "") return null
  const cleaned = value.replace(/,/g, "").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function convertBooleanYN(value: string): boolean | null {
  if (!value || value.trim() === "") return null
  const v = value.trim().toUpperCase()
  if (v === "Y") return true
  if (v === "N") return false
  return null
}

export function convertBooleanTF(value: string): boolean | null {
  if (!value || value.trim() === "") return null
  const v = value.trim().toUpperCase()
  if (v === "TRUE") return true
  if (v === "FALSE") return false
  return null
}

export function emptyToNull(value: string): string | null {
  if (!value || value.trim() === "") return null
  return value.trim()
}

export function parseIntSafe(value: string): number | null {
  if (!value || value.trim() === "") return null
  const cleaned = value.replace(/,/g, "").trim()
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? null : num
}

export function parseDateSafe(value: string): string | null {
  if (!value || value.trim() === "") return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`
  }
  return trimmed
}

const transformFns: Record<TransformType, (v: string) => unknown> = {
  koreanTime: convertKoreanTime,
  commaNumber: stripCommaNumber,
  booleanYN: convertBooleanYN,
  booleanTF: convertBooleanTF,
  integer: parseIntSafe,
  numeric: stripCommaNumber,
  date: parseDateSafe,
}

export function applyTransform(
  value: string,
  transformType: TransformType
): unknown {
  return transformFns[transformType](value)
}

export function transformRow(
  csvRow: Record<string, string>,
  headerMap: Record<string, string>,
  transformations: Record<string, TransformType>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [csvHeader, dbColumn] of Object.entries(headerMap)) {
    const rawValue = csvRow[csvHeader] ?? ""
    const transformType = transformations[dbColumn]

    if (transformType) {
      result[dbColumn] = applyTransform(rawValue, transformType)
    } else {
      result[dbColumn] = emptyToNull(rawValue)
    }
  }

  return result
}

export interface UnpivotedRow {
  fixedData: Record<string, unknown>
  year_month: string
  division: string
  value: number | null
}

export function unpivotMetricsRow(
  csvRow: Record<string, string>,
  fixedColumnMap: Record<string, string>,
  divisionColumn: string,
  monthPattern: RegExp
): UnpivotedRow[] {
  const fixedData: Record<string, unknown> = {}
  for (const [csvHeader, dbColumn] of Object.entries(fixedColumnMap)) {
    fixedData[dbColumn] = emptyToNull(csvRow[csvHeader] ?? "")
  }

  const division = csvRow[divisionColumn] ?? ""
  const rows: UnpivotedRow[] = []

  for (const [key, val] of Object.entries(csvRow)) {
    if (monthPattern.test(key)) {
      const numVal = stripCommaNumber(val)
      rows.push({
        fixedData,
        year_month: key,
        division,
        value: numVal,
      })
    }
  }

  return rows
}
