import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import assert from 'assert'
import firebaseFunctionsTest from 'firebase-functions-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize firebase-functions-test
const projectId = process.env.GCLOUD_PROJECT || 'library-app-dev'
const testEnv = firebaseFunctionsTest({ projectId })

// Test book configurations
const TEST_BOOKS = {
  sleepingMurder: {
    file: 'sleeping_murder.jpg',
    expectedAuthor: 'Agatha Christie',
    expectedTitle: 'Sleeping Murder',
  },
}

// Helper to load image as base64
function loadImageBase64(filename) {
  const imagePath = join(__dirname, 'fixtures', filename)
  const imageBuffer = readFileSync(imagePath)
  return imageBuffer.toString('base64')
}

// Helper to check if book matches expected criteria
function findMatchingBook(books, expectedTitle, expectedAuthor) {
  return books.find(book => {
    const titleMatch = book.title?.toLowerCase().includes(expectedTitle.toLowerCase())
    const authorMatch = book.author?.toLowerCase().includes(expectedAuthor.toLowerCase())
    return titleMatch && authorMatch
  })
}

describe('recognizeCover', () => {
  let recognizeCover

  before(async () => {
    // Import the function after testEnv is initialized
    const module = await import('../src/recognizeCover.js')
    recognizeCover = testEnv.wrap(module.recognizeCover)
  })

  after(() => {
    testEnv.cleanup()
  })

  it('rejects unauthenticated requests', async () => {
    const imageBase64 = loadImageBase64(TEST_BOOKS.sleepingMurder.file)

    try {
      await recognizeCover({
        data: { imageBase64 },
        auth: null,
      })
      assert.fail('Should have thrown unauthenticated error')
    } catch (error) {
      assert.strictEqual(error.code, 'unauthenticated')
    }
  })

  it('rejects missing imageBase64', async () => {
    try {
      await recognizeCover({
        data: {},
        auth: { uid: 'test-user' },
      })
      assert.fail('Should have thrown invalid-argument error')
    } catch (error) {
      assert.strictEqual(error.code, 'invalid-argument')
      assert.match(error.message, /imageBase64/)
    }
  })

  it('extracts OCR text from Sleeping Murder cover', async () => {
    const imageBase64 = loadImageBase64(TEST_BOOKS.sleepingMurder.file)
    const result = await recognizeCover({
      data: { imageBase64 },
      auth: { uid: 'test-user' },
    })

    assert.ok(result.rawText, 'Should return rawText')
    assert.ok(result.rawText.length > 0, 'rawText should not be empty')

    // Check for expected text in OCR output
    const lowerText = result.rawText.toLowerCase()
    assert.ok(
      lowerText.includes('agatha christie') || lowerText.includes('christie'),
      `Should detect author in OCR text: "${result.rawText}"`
    )
    assert.ok(
      lowerText.includes('sleeping') || lowerText.includes('murder'),
      `Should detect title words in OCR text: "${result.rawText}"`
    )
  })

  it('returns books array with results', async () => {
    const imageBase64 = loadImageBase64(TEST_BOOKS.sleepingMurder.file)
    const result = await recognizeCover({
      data: { imageBase64 },
      auth: { uid: 'test-user' },
    })

    assert.ok(Array.isArray(result.books), 'Should return books array')
    assert.ok(result.books.length > 0, 'Should return at least one book')
  })

  it('finds matching book in top results for Sleeping Murder', async () => {
    const imageBase64 = loadImageBase64(TEST_BOOKS.sleepingMurder.file)
    const result = await recognizeCover({
      data: { imageBase64 },
      auth: { uid: 'test-user' },
    })

    const { expectedTitle, expectedAuthor } = TEST_BOOKS.sleepingMurder
    const topResults = result.books.slice(0, 3)

    const matchingBook = findMatchingBook(topResults, expectedTitle, expectedAuthor)
    assert.ok(
      matchingBook,
      `Should find "${expectedTitle}" by ${expectedAuthor} in top 3 results. Got: ${JSON.stringify(
        topResults.map(b => ({ title: b.title, author: b.author })),
        null,
        2
      )}`
    )
  })

  it('returns candidates and search queries', async () => {
    const imageBase64 = loadImageBase64(TEST_BOOKS.sleepingMurder.file)
    const result = await recognizeCover({
      data: { imageBase64 },
      auth: { uid: 'test-user' },
    })

    assert.ok(result.candidates, 'Should return candidates')
    assert.ok(Array.isArray(result.candidates.titleCandidates), 'Should have titleCandidates array')
    assert.ok(Array.isArray(result.candidates.authorCandidates), 'Should have authorCandidates array')
    assert.ok(Array.isArray(result.searchQueries), 'Should have searchQueries array')
    assert.ok(result.searchQueries.length > 0, 'Should generate at least one search query')
  })
})
