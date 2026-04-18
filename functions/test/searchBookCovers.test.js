import assert from 'assert'
import firebaseFunctionsTest from 'firebase-functions-test'

const projectId = process.env.GCLOUD_PROJECT || 'library-app-dev'
const testEnv = firebaseFunctionsTest({ projectId })

describe('searchBookCovers', () => {
  let searchBookCovers

  before(async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            volumeInfo: {
              title: 'Dune',
              publishedDate: '1965',
              imageLinks: {
                thumbnail: 'http://example.com/dune.jpg'
              }
            }
          }
        ]
      })
    })

    const module = await import('../src/searchBookCovers.js')
    searchBookCovers = testEnv.wrap(module.searchBookCovers)
  })

  after(() => {
    global.fetch = undefined
    testEnv.cleanup()
  })

  it('rejects unauthenticated requests', async () => {
    try {
      await searchBookCovers({ data: { title: 'Dune' }, auth: null })
      assert.fail('Should have thrown unauthenticated error')
    } catch (error) {
      assert.strictEqual(error.code, 'unauthenticated')
    }
  })

  it('rejects requests without a title or author', async () => {
    try {
      await searchBookCovers({ data: { title: '   ', author: '' }, auth: { uid: 'test-user' } })
      assert.fail('Should have thrown invalid-argument error')
    } catch (error) {
      assert.strictEqual(error.code, 'invalid-argument')
      assert.match(error.message, /title or author/i)
    }
  })

  it('returns lightweight cover options for valid requests', async () => {
    const result = await searchBookCovers({
      data: { title: 'Dune', author: 'Frank Herbert' },
      auth: { uid: 'test-user' }
    })

    assert.deepStrictEqual(result, {
      covers: [
        {
          url: 'https://example.com/dune.jpg',
          source: 'Dune (1965)'
        }
      ]
    })
  })
})
