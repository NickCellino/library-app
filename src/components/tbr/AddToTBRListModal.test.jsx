import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const { lookupBookByIsbnMock, useBarcodeScannerMock } = vi.hoisted(() => ({
  lookupBookByIsbnMock: vi.fn(),
  useBarcodeScannerMock: vi.fn()
}))

vi.mock('../../utils/googleBooksClient', () => ({
  lookupBookByIsbn: lookupBookByIsbnMock
}))

vi.mock('../../hooks/useBarcodeScanner', () => ({
  useBarcodeScanner: useBarcodeScannerMock
}))

vi.mock('../library/BookCard', () => ({
  default: () => null
}))

import AddToTBRListModal from './AddToTBRListModal'

describe('AddToTBRListModal scan flow', () => {
  const onClose = vi.fn()
  const onAddBook = vi.fn()
  const onAddNewBook = vi.fn()
  let scannerOptions

  beforeEach(() => {
    vi.clearAllMocks()
    scannerOptions = undefined

    useBarcodeScannerMock.mockImplementation((options) => {
      scannerOptions = options
      return {
        videoRef: { current: null },
        canvasRef: { current: null },
        isScanning: true,
        isLoading: false,
        loadingISBN: '',
        currentToast: null,
        startCamera: vi.fn(),
        stopCamera: vi.fn(),
        showToast: vi.fn()
      }
    })
  })

  it('looks up missing library books through the backend client before adding them to TBR', async () => {
    lookupBookByIsbnMock.mockResolvedValue({
      title: 'Dune',
      author: 'Frank Herbert',
      publisher: 'Chilton Books'
    })

    render(
      <AddToTBRListModal
        isOpen
        onClose={onClose}
        tbrList={{ id: 'tbr-1', name: 'Sci-Fi', bookIds: [] }}
        books={[]}
        onAddBook={onAddBook}
        onAddNewBook={onAddNewBook}
      />
    )

    const helpers = { showToast: vi.fn() }
    await scannerOptions.onScan('9780441172719', helpers)

    expect(lookupBookByIsbnMock).toHaveBeenCalledWith('9780441172719')
    expect(onAddNewBook).toHaveBeenCalledTimes(1)
    expect(onAddNewBook.mock.calls[0][0]).toMatchObject({
      isbn: '9780441172719',
      title: 'Dune',
      author: 'Frank Herbert',
      publisher: 'Chilton Books'
    })
    expect(helpers.showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: 'success',
      message: 'Added to library and TBR list'
    }))
  })

  it('preserves not-found behavior for missing library books', async () => {
    lookupBookByIsbnMock.mockResolvedValue(null)

    render(
      <AddToTBRListModal
        isOpen
        onClose={onClose}
        tbrList={{ id: 'tbr-1', name: 'Sci-Fi', bookIds: [] }}
        books={[]}
        onAddBook={onAddBook}
        onAddNewBook={onAddNewBook}
      />
    )

    const helpers = { showToast: vi.fn() }
    await scannerOptions.onScan('9780441172719', helpers)

    expect(lookupBookByIsbnMock).toHaveBeenCalledWith('9780441172719')
    expect(onAddNewBook).not.toHaveBeenCalled()
    expect(helpers.showToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'ISBN 9780441172719 not found'
    })
  })
})
