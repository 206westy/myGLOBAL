import { createServiceClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const BATCH_SIZE = 10
const DEFAULT_REASONING_EFFORT = "medium"

const SYSTEM_PROMPT = `You are analyzing semiconductor equipment maintenance records to extract CIP (Continuous Improvement Program) hints.
Extract ONLY relevant patterns from the description. If no pattern exists, return null.

Look for:
- recurring_failure: Same part/area failing repeatedly
- rework_pattern: Part replacement followed by recurrence
- cascade_failure: Repairing A causes B to fail
- sop_missing: No SOP exists or SOP not followed
- design_defect: Suspected design or manufacturing defect
- long_work_time: Abnormally long work time with identifiable cause

Return JSON array or null:
[{"hint_type": "recurring_failure", "description": "...", "severity": "high|medium|low"}]`

interface HintResult {
  hint_type: string
  description: string
  severity: string
}

interface SoDescriptionRow {
  order_no: string
  description: string
}

const VALID_HINT_TYPES = new Set([
  "recurring_failure",
  "rework_pattern",
  "cascade_failure",
  "sop_missing",
  "design_defect",
  "long_work_time",
])

const VALID_SEVERITIES = new Set(["high", "medium", "low"])

function validateHints(raw: unknown): HintResult[] | null {
  if (raw === null || raw === undefined) return null
  if (!Array.isArray(raw)) return null

  const valid: HintResult[] = []
  for (const item of raw) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof item.hint_type === "string" &&
      VALID_HINT_TYPES.has(item.hint_type) &&
      typeof item.description === "string" &&
      typeof item.severity === "string" &&
      VALID_SEVERITIES.has(item.severity)
    ) {
      valid.push({
        hint_type: item.hint_type,
        description: item.description,
        severity: item.severity,
      })
    }
  }

  return valid.length > 0 ? valid : null
}

async function extractHintsFromDescription(
  client: OpenAI,
  orderNo: string,
  description: string,
  reasoningEffort: string
): Promise<{ orderNo: string; hints: HintResult[] | null; error?: string }> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 500,
      reasoning_effort: reasoningEffort as "low" | "medium" | "high",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Service Order: ${orderNo}\nDescription:\n${description}`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content ?? ""

    const usage = response.usage
    console.log(
      `[hints] ${orderNo}: ${usage?.prompt_tokens ?? 0} input + ${usage?.completion_tokens ?? 0} output tokens`
    )

    const trimmed = text.trim()
    if (trimmed === "null" || trimmed === "") {
      return { orderNo, hints: null }
    }

    const parsed = JSON.parse(trimmed)
    const validated = validateHints(parsed)
    return { orderNo, hints: validated }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[hints] Failed to extract hints for ${orderNo}: ${message}`)
    return { orderNo, hints: null, error: message }
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { yearMonth, reasoningEffort } = body as {
    yearMonth: string
    reasoningEffort?: string
  }

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return Response.json(
      { error: "Invalid yearMonth format. Expected YYYY-MM" },
      { status: 400 }
    )
  }

  const effort = reasoningEffort ?? DEFAULT_REASONING_EFFORT

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    )
  }

  const openai = new OpenAI({ apiKey })
  const supabase = createServiceClient()

  const startDate = `${yearMonth}-01`
  const [year, month] = yearMonth.split("-").map(Number)
  const nextMonth =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`

  const { data: rows, error: fetchError } = await supabase
    .from("so_descriptions")
    .select("order_no, description, service_orders!inner(work_start_date)")
    .gte("service_orders.work_start_date", startDate)
    .lt("service_orders.work_start_date", nextMonth)

  if (fetchError) {
    return Response.json(
      { error: `Failed to fetch descriptions: ${fetchError.message}` },
      { status: 500 }
    )
  }

  const descriptions: SoDescriptionRow[] = (rows ?? []).map(
    (r: Record<string, unknown>) => ({
      order_no: r.order_no as string,
      description: r.description as string,
    })
  )

  if (descriptions.length === 0) {
    return Response.json({
      message: "No service order descriptions found for the given month",
      totalProcessed: 0,
      hintsFound: 0,
      errors: 0,
    })
  }

  let totalProcessed = 0
  let hintsFound = 0
  let errorCount = 0
  const totalBatches = Math.ceil(descriptions.length / BATCH_SIZE)

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batch = descriptions.slice(
      batchIdx * BATCH_SIZE,
      (batchIdx + 1) * BATCH_SIZE
    )

    try {
      const results = await Promise.all(
        batch.map((row) =>
          extractHintsFromDescription(openai, row.order_no, row.description, effort)
        )
      )

      const hintsToInsert: Array<{
        order_no: string
        hint_type: string
        description: string
        severity: string
      }> = []

      for (const result of results) {
        totalProcessed++

        if (result.error) {
          errorCount++
          continue
        }

        if (result.hints) {
          for (const hint of result.hints) {
            hintsToInsert.push({
              order_no: result.orderNo,
              hint_type: hint.hint_type,
              description: hint.description,
              severity: hint.severity,
            })
          }
          hintsFound += result.hints.length
        }
      }

      if (hintsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("so_description_hints")
          .upsert(hintsToInsert, { onConflict: "order_no, hint_type" })

        if (insertError) {
          console.error(
            `[hints] Batch ${batchIdx + 1} insert error:`,
            insertError.message
          )
          errorCount += hintsToInsert.length
        }
      }

      console.log(
        `[hints] Batch ${batchIdx + 1}/${totalBatches} complete: ${batch.length} processed (reasoning: ${effort})`
      )
    } catch (batchErr) {
      const message =
        batchErr instanceof Error ? batchErr.message : String(batchErr)
      console.error(
        `[hints] Batch ${batchIdx + 1}/${totalBatches} failed: ${message}`
      )
      errorCount += batch.length
      totalProcessed += batch.length
    }
  }

  return Response.json({
    message: "Hint extraction complete",
    yearMonth,
    reasoningEffort: effort,
    totalProcessed,
    hintsFound,
    errors: errorCount,
  })
}
