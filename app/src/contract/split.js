// Splits a contract into clauses small enough for a small model's context.

const MAX_CHARS = 2400
const MIN_CHARS = 60

// "1.", "2.3", "12)", "Section 4", "ARTICLE IV", "Clause 7:"
const NUMBERED = /^\s*(?:(?:section|article|clause)\s+[\dIVXLC]+\b|\d{1,2}(?:\.\d{1,2})*[.)](?=\s))/i
// Lines that only mark the signature block.
const SIGNATURE = /^\s*(?:in witness whereof|signature|signed|by:|name:|title:|date:)|_{4,}/i

function isHeadingOnly(block) {
  return block.length < 80 && !/[.;:]$/.test(block.trim()) && !block.includes('\n')
}

function splitLong(text) {
  if (text.length <= MAX_CHARS) return [text]
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [text]
  const chunks = []
  let current = ''
  for (const s of sentences) {
    if (current && current.length + s.length > MAX_CHARS) {
      chunks.push(current.trim())
      current = ''
    }
    current += s
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function titleOf(text) {
  const firstLine = text.split('\n')[0].trim()
  const short = firstLine.length > 70 ? firstLine.slice(0, 67).trimEnd() + '…' : firstLine
  return short
}

export function splitClauses(raw) {
  const text = raw.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim()
  const lines = text.split('\n')

  // Prefer numbered clauses; fall back to paragraphs for unnumbered contracts.
  const numberedCount = lines.filter((l) => NUMBERED.test(l)).length
  let blocks
  if (numberedCount >= 3) {
    blocks = []
    let current = []
    for (const line of lines) {
      if ((NUMBERED.test(line) || SIGNATURE.test(line)) && current.join('').trim()) {
        blocks.push(current.join('\n'))
        current = []
      }
      current.push(line)
    }
    blocks.push(current.join('\n'))
  } else {
    blocks = text.split(/\n\s*\n/)
  }

  // A heading on its own ("PAYMENT") belongs to the block after it.
  const merged = []
  let pendingHeading = ''
  for (const b of blocks.map((b) => b.trim()).filter(Boolean)) {
    if (isHeadingOnly(b)) {
      pendingHeading += (pendingHeading ? '\n' : '') + b
      continue
    }
    merged.push(pendingHeading ? `${pendingHeading}\n${b}` : b)
    pendingHeading = ''
  }
  if (pendingHeading) merged.push(pendingHeading)

  const clauses = []
  for (const block of merged) {
    const body = block.replace(/\n(?!\n)/g, ' ').replace(/\s+/g, ' ').trim()
    const skip =
      body.length < MIN_CHARS ? 'too short' : SIGNATURE.test(block) ? 'signature block' : null
    const parts = skip ? [block] : splitLong(block)
    const title = titleOf(block)
    parts.forEach((part, i) => {
      clauses.push({
        id: clauses.length,
        title: title + (parts.length > 1 ? ` (part ${i + 1}/${parts.length})` : ''),
        text: part.trim(),
        skip,
      })
    })
  }
  return clauses
}
