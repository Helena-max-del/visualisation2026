export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  if (!lines.length) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = splitCsvLine(line)
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim()
    })
    return row
  })
}

function splitCsvLine(line) {
  const out = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current)
  return out
}

export const asNumber = (value) => Number(String(value).replace(/,/g, ''))
