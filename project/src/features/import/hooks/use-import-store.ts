"use client"

import { create } from "zustand"
import type {
  TcodeKey,
  ImportPhase,
  ImportError,
  ImportLogEntry,
} from "../lib/types"

interface ImportStore {
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

  setTcode: (tcode: TcodeKey) => void
  setFile: (file: File | null, rowCount?: number, columns?: string[]) => void
  setPhase: (phase: ImportPhase | null) => void
  setProgress: (p: {
    current: number
    total: number
    successCount: number
    errorCount: number
  }) => void
  addErrors: (errors: ImportError[]) => void
  setIsImporting: (v: boolean) => void
  setImportHistory: (h: ImportLogEntry[]) => void
  reset: () => void
}

const initialProgress = { current: 0, total: 0, successCount: 0, errorCount: 0 }

export const useImportStore = create<ImportStore>((set) => ({
  selectedTcode: null,
  file: null,
  csvRowCount: 0,
  csvColumns: [],
  phase: null,
  progress: initialProgress,
  errors: [],
  isImporting: false,
  importHistory: [],

  setTcode: (tcode) => set({ selectedTcode: tcode }),
  setFile: (file, rowCount = 0, columns = []) =>
    set({ file, csvRowCount: rowCount, csvColumns: columns }),
  setPhase: (phase) => set({ phase }),
  setProgress: (progress) => set({ progress }),
  addErrors: (errors) =>
    set((s) => ({ errors: [...s.errors, ...errors].slice(0, 500) })),
  setIsImporting: (isImporting) => set({ isImporting }),
  setImportHistory: (importHistory) => set({ importHistory }),
  reset: () =>
    set({
      file: null,
      csvRowCount: 0,
      csvColumns: [],
      phase: null,
      progress: initialProgress,
      errors: [],
      isImporting: false,
    }),
}))
