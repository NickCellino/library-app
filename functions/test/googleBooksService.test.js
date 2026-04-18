import assert from 'assert'

describe('googleBooksService', () => {
  afterEach(() => {
    global.fetch = undefined
  })

  it('normalizes the first ISBN lookup result', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            volumeInfo: {
              title: 'The Left Hand of Darkness',
              authors: ['Ursula K. Le Guin'],
              publishedDate: '1969-03-01',
              publisher: 'Ace',
              pageCount: 304,
              imageLinks: {
                thumbnail: 'http://example.com/cover.jpg'
              },
              industryIdentifiers: [
                { type: 'ISBN_10', identifier: '0441478123' },
                { type: 'ISBN_13', identifier: '9780441478125' }
              ]
            }
          }
        ]
      })
    })

    const { lookupBookByIsbn } = await import('../src/googleBooksService.js')
    const result = await lookupBookByIsbn('9780441478125')

    assert.deepStrictEqual(result, {
      title: 'The Left Hand of Darkness',
      author: 'Ursula K. Le Guin',
      publishYear: 1969,
      publisher: 'Ace',
      pageCount: 304,
      coverUrl: 'https://example.com/cover.jpg',
      isbn: '9780441478125'
    })
  })

  it('returns null when Google Books has no match', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ items: [] })
    })

    const { lookupBookByIsbn } = await import('../src/googleBooksService.js')
    const result = await lookupBookByIsbn('9780441478125')

    assert.strictEqual(result, null)
  })
})
