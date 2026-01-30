# Fix: Improve Book Cover Recognition Ranking

## Phase 1: Create Benchmark Test

Replace pass/fail tests with a benchmark that scores ranking quality.

### Changes to recognizeCover.test.js

**1. Add benchmark test** that:
- Iterates all 9 TEST_BOOKS
- Calls `recognizeCover` for each
- Finds position of correct book in results using `findMatchingBookIndex()`
- Calculates score: position 0 = 100, position 1 = 90, ... not found = 0
- Prints table with per-book results and average score
- Always passes (informational only)

**2. Remove** specific pass/fail test:
- "finds matching book in top results for Sleeping Murder"

**3. Generalize** remaining tests:
- "extracts OCR text" → use first TEST_BOOK, check rawText exists
- Keep auth/validation tests as-is

### Benchmark output format

```
=== RANKING BENCHMARK ===
Book                         | Position | Score
-----------------------------|----------|------
Sleeping Murder              |    4     |  60
A Prayer For The Crown-Shy   |    0     | 100
Book Lovers                  |    1     |  90
...
-----------------------------|----------|------
AVERAGE                      |          |  75
```

## File to Modify

`functions/test/recognizeCover.test.js`

## Verification

```bash
cd functions && npm test
```

---

## Phase 2: Improve Ranking (iterate using benchmark)

After benchmark exists, improve ranking by:

### textParser.js
- Dedupe: don't add to titleCandidates if already in authorCandidates
- Query order: title+author combos first, skip redundant queries

### bookSearch.js
- Add `scoreResult(book, candidates)` function
- Modify `searchWithMultipleQueries` to score and sort results

### recognizeCover.js
- Pass candidates to search function

Run benchmark after each change to measure improvement.
