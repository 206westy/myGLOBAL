import type { ImportEvent, TcodeKey } from "./types"

export async function startImport(
  tcode: TcodeKey,
  filePath: string,
  onEvent: (event: ImportEvent) => void
): Promise<void> {
  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tcode, filePath }),
  })

  if (!response.ok) {
    const text = await response.text()
    onEvent({ type: "error", message: `HTTP ${response.status}: ${text}` })
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onEvent({ type: "error", message: "No response body" })
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split("\n\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data: ")) continue

      try {
        const json = trimmed.slice(6)
        const event: ImportEvent = JSON.parse(json)
        onEvent(event)
      } catch {
        // skip malformed events
      }
    }
  }

  if (buffer.trim().startsWith("data: ")) {
    try {
      const event: ImportEvent = JSON.parse(buffer.trim().slice(6))
      onEvent(event)
    } catch {
      // skip
    }
  }
}
