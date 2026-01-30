# Test recognizeCover Cloud Function

## Approach
Direct function test using `firebase-functions-test` library with real external APIs (Vision + Books).

## Files to Create/Modify

### 1. `functions/test/fixtures/sleeping_murder.jpg`
Copy test image from project root.

### 2. `functions/test/recognizeCover.test.js`
Test file structure:
- Use `firebase-functions-test` to wrap the v2 callable function
- Pass mock auth context: `{ auth: { uid: 'test-user' } }`
- Load test image as base64
- Assert on: rawText contains expected text, books array has matches

```javascript
const testEnv = firebaseFunctionsTest({ projectId: 'library-app-...' })
const wrapped = testEnv.wrap(recognizeCover)

const result = await wrapped({
  data: { imageBase64 },
  auth: { uid: 'test-user' }
})
```

### 3. `functions/package.json`
Add devDependencies:
```json
"devDependencies": {
  "firebase-functions-test": "^3.4.0",
  "mocha": "^10.0.0"
}
```
Add test script:
```json
"test": "mocha 'test/**/*.test.js' --timeout 30000"
```

### 4. `functions/.secret.local` (create, gitignored)
```
GOOGLE_BOOKS_API_KEY=your-api-key
```

## Test Cases

```javascript
const TEST_BOOKS = {
  sleepingMurder: {
    file: 'sleeping_murder.jpg',
    expectedAuthor: 'Agatha Christie',
    expectedTitle: 'Sleeping Murder',
  },
  // Easy to add more
}
```

Tests:
1. Rejects unauthenticated requests (auth: null)
2. Rejects missing imageBase64
3. OCR text contains expected strings
4. Books array has at least one result
5. **Matching book appears in top 3 results** (title or author match)

## Auth/API Setup

1. **Firebase Test SDK**: `firebase-functions-test` allows calling with mock auth context
2. **Vision API**: Uses Application Default Credentials (`gcloud auth application-default login`)
3. **Books API**: Reads from `GOOGLE_BOOKS_API_KEY` env var or `.secret.local`

## Running Tests

```bash
cd functions
npm install
npm test
```

## Verification
1. Run `npm test` in functions/
2. All tests pass
3. Check test output shows OCR detected "Agatha Christie" and "Sleeping Murder"
4. Verify at least one book result matches in top 3
