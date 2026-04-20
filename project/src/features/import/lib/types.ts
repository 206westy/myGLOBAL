export type TcodeKey =
  | "ZCSR0010"
  | "ZCSR0070D_INSTALL"
  | "ZCSR0070D"
  | "ZCSR0140D"
  | "ZCSR0100"
  | "ZCSR0150"
  | "ZCSR0210"
  | "ZSDR0030D"
  | "ZSDR0040D"
  | "BRANCH"

export type ImportPhase =
  | "parsing"
  | "lookup_extraction"
  | "importing"
  | "refreshing_views"
  | "complete"
  | "error"

export type ImportEvent =
  | { type: "phase"; phase: ImportPhase }
  | {
      type: "progress"
      current: number
      total: number
      successCount: number
      errorCount: number
    }
  | {
      type: "chunk_done"
      chunkIndex: number
      totalChunks: number
      rowsInChunk: number
      errors: ImportError[]
    }
  | { type: "error"; message: string; row?: number; column?: string }
  | { type: "complete"; summary: ImportSummary }

export interface ImportError {
  row: number
  column?: string
  message: string
  data?: Record<string, string>
}

export interface ImportSummary {
  tcode: TcodeKey
  fileName: string
  totalRows: number
  successCount: number
  errorCount: number
  durationMs: number
  errors: ImportError[]
}

export type TransformType =
  | "koreanTime"
  | "commaNumber"
  | "booleanYN"
  | "booleanTF"
  | "integer"
  | "numeric"
  | "date"

export interface LookupExtraction {
  table: string
  rpcFunction: string
  codeColumn: string
  nameColumn: string
  extraColumns?: Record<string, string>
}

export interface TcodeConfig {
  tcode: TcodeKey
  label: string
  description: string
  targetTable: string
  rpcFunction: string
  csvHeaderMap: Record<string, string>
  transformations: Record<string, TransformType>
  lookupExtractions: LookupExtraction[]
  isUnpivot?: boolean
  unpivotConfig?: {
    fixedColumns: string[]
    divisionColumn: string
    monthColumnPattern: RegExp
  }
}

export interface ImportState {
  selectedTcode: TcodeKey | null
  file: File | null
  csvRowCount: number
  csvColumns: string[]
  phase: ImportPhase | null
  progress: {
    current: number
    total: number
    successCount: number
    errorCount: number
  }
  errors: ImportError[]
  isImporting: boolean
  importHistory: ImportLogEntry[]
}

export interface ImportLogEntry {
  id: string
  tcode: string
  file_name: string
  row_count: number
  success_count: number
  error_count: number
  status: string
  started_at: string
  completed_at: string | null
}
