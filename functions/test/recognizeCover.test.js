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
  prayer: {
    file: 'a_prayer_for_the_crown_shy.jpeg',
    expectedAuthor: 'Becky Chambers',
    expectedTitle: 'A Prayer For The Crown-Shy',
  },
  bookLovers: {
    file: 'book_lovers.jpeg',
    expectedAuthor: 'Emily Henry',
    expectedTitle: 'Book Lovers',
  },
  childrenOfRedPeak: {
    file: 'the_children_of_red_peak.jpeg',
    expectedAuthor: 'Craig DiLouie',
    expectedTitle: 'The Children of Red Peak',
  },
  theEscape: {
    file: 'the_escape.jpeg',
    expectedAuthor: 'Hannah Jayne',
    expectedTitle: 'The Escape',
  },
  atomicHabits: {
    file: 'atomic_habits.jpeg',
    expectedAuthor: 'James Clear',
    expectedTitle: 'Atomic Habits',
  },
  summerOfTheRedWolf: {
    file: 'summer_of_the_red_wolf.jpeg',
    expectedAuthor: 'Morris West',
    expectedTitle: 'Summer of the Red Wolf',
  },
  marquiseOfO: {
    file: 'the_marquise_of_O.jpeg',
    expectedAuthor: 'Heinrich von Kleist',
    expectedTitle: 'The Marquise of O',
  },
  surviveTheNight: {
    file: 'survive_the_night.jpeg',
    expectedAuthor: 'Riley Sager',
    expectedTitle: 'Survive the Night',
  }
}

// Helper to load image as base64
function loadImageBase64(filename) {
  const imagePath = join(__dirname, 'fixtures', filename)
  const imageBuffer = readFileSync(imagePath)
  return imageBuffer.toString('base64')
}

// Helper to find index of matching book in results
function findMatchingBookIndex(books, expectedTitle, expectedAuthor) {
  return books.findIndex(book => {
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

  it('extracts OCR text from book cover', async () => {
    const testBook = Object.values(TEST_BOOKS)[0]
    const imageBase64 = loadImageBase64(testBook.file)
    const result = await recognizeCover({
      data: { imageBase64 },
      auth: { uid: 'test-user' },
    })

    assert.ok(result.rawText, 'Should return rawText')
    assert.ok(result.rawText.length > 0, 'rawText should not be empty')
  })

  it('returns books array with results', async () => {
    const testBook = Object.values(TEST_BOOKS)[0]
    const imageBase64 = loadImageBase64(testBook.file)
    const result = await recognizeCover({
      data: { imageBase64 },
      auth: { uid: 'test-user' },
    })

    assert.ok(Array.isArray(result.books), 'Should return books array')
    assert.ok(result.books.length > 0, 'Should return at least one book')
  })

  it('returns candidates and search queries', async () => {
    const testBook = Object.values(TEST_BOOKS)[0]
    const imageBase64 = loadImageBase64(testBook.file)
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

  it('BENCHMARK: ranking quality across all test books', async function() {
    this.timeout(180000) // 3 min for all books

    const results = []
    const bookEntries = Object.entries(TEST_BOOKS)

    console.log('\n=== RANKING BENCHMARK ===')
    console.log('Book                              | Position | Score')
    console.log('----------------------------------|----------|------')

    for (const [key, book] of bookEntries) {
      try {
        const imageBase64 = loadImageBase64(book.file)
        const result = await recognizeCover({
          data: { imageBase64 },
          auth: { uid: 'test-user' },
        })

        const position = findMatchingBookIndex(result.books, book.expectedTitle, book.expectedAuthor)
        const score = position === -1 ? 0 : Math.max(0, 100 - position * 10)

        results.push({ key, book, position, score, error: null })

        const posStr = position === -1 ? 'N/F' : position.toString()
        const name = book.expectedTitle.padEnd(33)
        console.log(`${name} |    ${posStr.padEnd(5)} | ${score.toString().padStart(3)}`)
      } catch (err) {
        results.push({ key, book, position: -1, score: 0, error: err.message })
        const name = book.expectedTitle.padEnd(33)
        console.log(`${name} |   ERR   |   0`)
      }
    }

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    console.log('----------------------------------|----------|------')
    console.log(`${'AVERAGE'.padEnd(33)} |          | ${avgScore.toFixed(0).padStart(3)}`)
    console.log('')

    // Log failures for debugging
    const failures = results.filter(r => r.position === -1 || r.position > 2)
    if (failures.length > 0) {
      console.log('=== NEEDS IMPROVEMENT ===')
      for (const f of failures) {
        if (f.error) {
          console.log(`\n${f.book.expectedTitle}: ERROR - ${f.error}`)
        } else {
          console.log(`\n${f.book.expectedTitle} (position: ${f.position === -1 ? 'not found' : f.position})`)
        }
      }
    }

    // Benchmark always passes - it's informational
    assert.ok(true)
  })
})
