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

import BarcodeScannerModal from './BarcodeScannerModal'

describe('BarcodeScannerModal', () => {
  const onAdd = vi.fn()
  const onClose = vi.fn()
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
        dismissToast: vi.fn()
      }
    })
  })

  it('looks up new scans through the backend client and adds the book', async () => {
    lookupBookByIsbnMock.mockResolvedValue({
      title: 'Dune',
      author: 'Frank Herbert',
      coverUrl: 'https://example.com/dune.jpg'
    })

    render(<BarcodeScannerModal onAdd={onAdd} onClose={onClose} books={[]} />)

    const helpers = {
      showToast: vi.fn(),
      dismissToast: vi.fn(),
      removeFromCooldown: vi.fn(),
      resetProcessing: vi.fn()
    }

    await scannerOptions.onScan('9780441172719', helpers)

    expect(lookupBookByIsbnMock).toHaveBeenCalledWith('9780441172719')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      isbn: '9780441172719',
      title: 'Dune',
      author: 'Frank Herbert',
      coverUrl: 'https://example.com/dune.jpg'
    })
    expect(helpers.showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: 'success'
    }))
  })

  it('preserves duplicate add-anyway behavior without bypassing the backend client', async () => {
    lookupBookByIsbnMock.mockResolvedValue({
      title: 'Dune',
      author: 'Frank Herbert'
    })

    render(
      <BarcodeScannerModal
        onAdd={onAdd}
        onClose={onClose}
        books={[{ id: 'existing', isbn: '9780441172719', title: 'Dune', author: 'Frank Herbert' }]}
      />
    )

    const helpers = {
      showToast: vi.fn(),
      dismissToast: vi.fn(),
      removeFromCooldown: vi.fn(),
      resetProcessing: vi.fn()
    }

    await scannerOptions.onScan('9780441172719', helpers)

    expect(lookupBookByIsbnMock).not.toHaveBeenCalled()
    expect(helpers.showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: 'duplicate',
      interactive: true
    }))

    const duplicateToast = helpers.showToast.mock.calls[0][0]
    await duplicateToast.onAction()

    expect(helpers.dismissToast).toHaveBeenCalled()
    expect(helpers.removeFromCooldown).toHaveBeenCalledWith('9780441172719')
    expect(lookupBookByIsbnMock).toHaveBeenCalledWith('9780441172719')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(helpers.showToast).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'success'
    }))
  })
})
