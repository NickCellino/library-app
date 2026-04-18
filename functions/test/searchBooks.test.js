import assert from 'assert'
import firebaseFunctionsTest from 'firebase-functions-test'

const projectId = process.env.GCLOUD_PROJECT || 'library-app-dev'
const testEnv = firebaseFunctionsTest({ projectId })

describe('searchBooks', () => {
  let searchBooks

  before(async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            volumeInfo: {
              title: 'Dune',
              authors: ['Frank Herbert'],
              publishedDate: '1965',
              publisher: 'Chilton Books',
              pageCount: 412,
              imageLinks: {
                thumbnail: 'http://example.com/dune.jpg'
              },
              industryIdentifiers: [
                { type: 'ISBN_13', identifier: '9780441172719' }
              ]
            }
          }
        ]
      })
    })

    const module = await import('../src/searchBooks.js')
    searchBooks = testEnv.wrap(module.searchBooks)
  })

  after(() => {
    global.fetch = undefined
    testEnv.cleanup()
  })

  it('rejects unauthenticated requests', async () => {
    try {
      await searchBooks({ data: { title: 'Dune' }, auth: null })
      assert.fail('Should have thrown unauthenticated error')
    } catch (error) {
      assert.strictEqual(error.code, 'unauthenticated')
    }
  })

  it('rejects requests without a title or author', async () => {
    try {
      await searchBooks({ data: { title: '   ', author: '' }, auth: { uid: 'test-user' } })
      assert.fail('Should have thrown invalid-argument error')
    } catch (error) {
      assert.strictEqual(error.code, 'invalid-argument')
      assert.match(error.message, /title or author/i)
    }
  })

  it('returns normalized book results for valid requests', async () => {
    const result = await searchBooks({
      data: { title: 'Dune', author: 'Frank Herbert' },
      auth: { uid: 'test-user' }
    })

    assert.deepStrictEqual(result, {
      books: [
        {
          title: 'Dune',
          author: 'Frank Herbert',
          publishYear: 1965,
          publisher: 'Chilton Books',
          pageCount: 412,
          coverUrl: 'https://example.com/dune.jpg',
          isbn: '9780441172719'
        }
      ]
    })
  })
})
