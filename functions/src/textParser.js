/**
 * Parse OCR text to extract likely title and author candidates
 *
 * Heuristics:
 * - Title usually appears larger/first on book covers
 * - Author often preceded by "by" or appears after title
 * - Lines in ALL CAPS or mixed case with first-letter caps are likely titles
 * - Names follow patterns like "First Last" or "First M. Last"
 */

import { isCommonFirstName } from './commonFirstNames.js'

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

  // First pass: join consecutive short ALL CAPS lines (likely multi-line title)
  const joinedLines = []
  let accumulator = []

  for (const line of lines) {
    if (isShortAllCaps(line)) {
      accumulator.push(line)
    } else {
      if (accumulator.length > 1) {
        // Join accumulated title words
        joinedLines.push(accumulator.join(' '))
      } else if (accumulator.length === 1) {
        joinedLines.push(accumulator[0])
      }
      accumulator = []
      joinedLines.push(line)
    }
  }
  // Handle remaining accumulator
  if (accumulator.length > 1) {
    joinedLines.push(accumulator.join(' '))
  } else if (accumulator.length === 1) {
    joinedLines.push(accumulator[0])
  }

  for (let i = 0; i < joinedLines.length; i++) {
    const line = joinedLines[i]
    const prevLine = joinedLines[i - 1]?.toLowerCase() || ''

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

    // Name-like strings (potential author) - but not if it looks like a title phrase
    // Also check that it doesn't contain common title words
    if (looksLikeName(line) && !looksLikeTitlePhrase(line) && !containsTitleWord(line)) {
      authorCandidates.push(cleanText(line))
    }

    // Title-like strings
    if (looksLikeTitle(line) && titleCandidates.length < 5) {
      titleCandidates.push(cleanText(line))
    }
  }

  // Also extract prominent ALL CAPS words that might be title fragments
  // This helps when titles span multiple non-consecutive lines
  const allCapsWords = lines
    .filter(line => /^[A-Z]{3,}$/.test(line.trim()) && !isBoilerplate(line))
    .map(line => line.trim())

  // If we have 2+ ALL CAPS words that might form a title, add combination
  if (allCapsWords.length >= 2 && allCapsWords.length <= 4) {
    const combinedTitle = allCapsWords.join(' ')
    if (!titleCandidates.includes(combinedTitle)) {
      titleCandidates.unshift(combinedTitle) // Add to front as high priority
    }
  }

  // Deduplicate authors
  const uniqueAuthors = [...new Set(authorCandidates)].slice(0, 3)

  // Deduplicate titles, excluding anything already identified as author
  const authorLower = new Set(uniqueAuthors.map(a => a.toLowerCase()))
  const uniqueTitles = [...new Set(titleCandidates)]
    .filter(t => !authorLower.has(t.toLowerCase()))
    .slice(0, 5)

  return {
    titleCandidates: uniqueTitles,
    authorCandidates: uniqueAuthors
  }
}

function isShortAllCaps(text) {
  // Single word ALL CAPS that looks like a title word (not a name)
  const words = text.split(/\s+/)
  if (words.length !== 1) return false
  if (text !== text.toUpperCase()) return false
  if (!/^[A-Z]+$/.test(text)) return false
  // Allow short words if they're common title words (OF, THE, AND, etc.)
  const commonTitleWords = ['OF', 'THE', 'AND', 'OR', 'A', 'AN', 'IN', 'ON', 'AT', 'TO', 'FOR', 'BY']
  if (text.length <= 2 && !commonTitleWords.includes(text)) return false
  return true
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
    'copyright',
    'author of',
    'penguin',
    'classics',
    'other stories'
  ]
  return boilerplates.some(bp => lower.includes(bp))
}

function looksLikeName(text) {
  const words = text.split(/\s+/)

  // Single ALL CAPS word could be an author's last name
  if (words.length === 1 && text === text.toUpperCase() && /^[A-Z]{3,}$/.test(text)) {
    return true
  }

  // 2-4 words, each starting with capital
  if (words.length < 2 || words.length > 4) return false

  // Each word should start with capital (allow initials like J. K.)
  const allCapitalized = words.every(word => {
    const cleaned = word.replace(/[.,]/g, '')
    return cleaned.length > 0 && /^[A-Z]/.test(cleaned)
  })

  if (!allCapitalized) return false

  // Strong signal: first word is a common first name
  if (isCommonFirstName(words[0])) {
    return true
  }

  // Weaker signal: looks like a name pattern but no recognized first name
  // Be more conservative - require initials or other name-like patterns
  const hasInitial = words.some(w => /^[A-Z]\.$/.test(w))
  const hasVonDe = words.some(w => ['von', 'van', 'de', 'la', 'du'].includes(w.toLowerCase()))

  return hasInitial || hasVonDe
}

function looksLikeTitlePhrase(text) {
  // Detect phrases that look like titles rather than names
  // E.g. "THE MARQUISE OF O" contains articles/prepositions typical in titles
  const lower = text.toLowerCase()
  const titleWords = ['the', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'a', 'an']
  const words = lower.split(/\s+/)
  const titleWordCount = words.filter(w => titleWords.includes(w)).length
  // If more than 1 article/preposition, likely a title
  return titleWordCount >= 2
}

function containsTitleWord(text) {
  // Check if text contains words that are typically part of titles, not names
  const lower = text.toLowerCase()
  const titleKeywords = ['murder', 'death', 'escape', 'sleeping', 'night', 'red', 'peak', 'children', 'survive']
  return titleKeywords.some(kw => lower.includes(kw))
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
 * Prioritizes title+author combinations for better matching
 * @param {{ titleCandidates: string[], authorCandidates: string[] }} parsed
 * @returns {string[]} - Search queries to try
 */
export function generateSearchQueries(parsed) {
  const queries = []
  const seen = new Set()

  const addQuery = (q) => {
    const key = q.toLowerCase().trim()
    if (!seen.has(key) && key.length > 0) {
      seen.add(key)
      queries.push(q)
    }
  }

  // Priority 1: All title+author combinations (most likely to find exact match)
  for (const title of parsed.titleCandidates) {
    for (const author of parsed.authorCandidates) {
      addQuery(`${title} ${author}`)
    }
  }

  // Priority 2: Titles alone (may find book if author wasn't detected)
  for (const title of parsed.titleCandidates) {
    addQuery(title)
  }

  // Priority 3: Authors alone (fallback if title is garbled)
  for (const author of parsed.authorCandidates) {
    addQuery(author)
  }

  return queries.slice(0, 6)
}
