/**
 * Parse OCR text to extract likely title and author candidates
 *
 * Heuristics:
 * - Title usually appears larger/first on book covers
 * - Author often preceded by "by" or appears after title
 * - Lines in ALL CAPS or mixed case with first-letter caps are likely titles
 * - Names follow patterns like "First Last" or "First M. Last"
 */

/**
 * Extract title/author candidates from raw OCR text
 * @param {string} rawText - Raw text from Vision API
 * @returns {{ titleCandidates: string[], authorCandidates: string[] }}
 */
export function parseOcrText(rawText) {
  if (!rawText || !rawText.trim()) {
    return { titleCandidates: [], authorCandidates: [] }
  }

  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 1)

  const titleCandidates = []
  const authorCandidates = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prevLine = lines[i - 1]?.toLowerCase() || ''

    // Skip common non-book text
    if (isBoilerplate(line)) continue

    // Author detection: preceded by "by"
    if (prevLine.includes('by') && looksLikeName(line)) {
      authorCandidates.push(cleanText(line))
      continue
    }

    // Author detection: contains "by" inline
    const byMatch = line.match(/^by\s+(.+)$/i)
    if (byMatch && looksLikeName(byMatch[1])) {
      authorCandidates.push(cleanText(byMatch[1]))
      continue
    }

    // Name-like strings (potential author)
    if (looksLikeName(line)) {
      authorCandidates.push(cleanText(line))
    }

    // Title-like strings (typically first few significant lines)
    if (looksLikeTitle(line) && titleCandidates.length < 3) {
      titleCandidates.push(cleanText(line))
    }
  }

  // Deduplicate
  return {
    titleCandidates: [...new Set(titleCandidates)].slice(0, 5),
    authorCandidates: [...new Set(authorCandidates)].slice(0, 3)
  }
}

function isBoilerplate(text) {
  const lower = text.toLowerCase()
  const boilerplates = [
    'new york times bestseller',
    'bestseller',
    'a novel',
    'a memoir',
    'now a major motion picture',
    'introduction by',
    'foreword by',
    'translated by',
    'isbn',
    'barcode',
    '$',
    'www.',
    '.com',
    'copyright'
  ]
  return boilerplates.some(bp => lower.includes(bp))
}

function looksLikeName(text) {
  // 2-4 words, each starting with capital
  const words = text.split(/\s+/)
  if (words.length < 2 || words.length > 4) return false

  // Each word should start with capital (allow initials like J. K.)
  return words.every(word => {
    const cleaned = word.replace(/[.,]/g, '')
    return cleaned.length > 0 && /^[A-Z]/.test(cleaned)
  })
}

function looksLikeTitle(text) {
  // Reasonable length for a title
  if (text.length < 3 || text.length > 100) return false

  // Not just numbers or punctuation
  if (/^[\d\s\-.,]+$/.test(text)) return false

  // Contains at least some letters
  if (!/[a-zA-Z]{2,}/.test(text)) return false

  return true
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s'.-]/g, '')
    .trim()
}

/**
 * Generate search queries from parsed candidates
 * @param {{ titleCandidates: string[], authorCandidates: string[] }} parsed
 * @returns {string[]} - Search queries to try
 */
export function generateSearchQueries(parsed) {
  const queries = []

  // Combine best title + author candidates
  if (parsed.titleCandidates.length > 0 && parsed.authorCandidates.length > 0) {
    queries.push(`${parsed.titleCandidates[0]} ${parsed.authorCandidates[0]}`)
  }

  // Title only queries
  parsed.titleCandidates.forEach(title => {
    if (!queries.includes(title)) {
      queries.push(title)
    }
  })

  // Author + title combinations
  if (parsed.authorCandidates.length > 0 && parsed.titleCandidates.length > 1) {
    queries.push(`${parsed.titleCandidates[1]} ${parsed.authorCandidates[0]}`)
  }

  return queries.slice(0, 5)
}
