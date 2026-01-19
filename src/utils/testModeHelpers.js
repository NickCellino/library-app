export async function loadBarcodeImageData(isbn) {
  const response = await fetch(`/test-barcodes/${isbn}.png`)
  const blob = await response.blob()
  const imageBitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imageBitmap, 0, 0)
  return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height)
}

export const TEST_ISBNS = [
  { isbn: '9780743273565', title: 'The Great Gatsby' },
  { isbn: '9780451524935', title: '1984' },
]

export function isTestMode() {
  return new URLSearchParams(window.location.search).get('testMode') === 'true'
}
