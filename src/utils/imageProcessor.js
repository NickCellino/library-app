/**
 * Process image file - resize and compress
 * @param {File} file - Image file from input
 * @returns {Promise<Blob>} - Compressed JPEG blob
 */
export async function processImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const blob = resizeAndCompress(img)
          resolve(blob)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Process image from video element (camera capture)
 * @param {HTMLVideoElement} videoElement - Video element from camera stream
 * @returns {Blob} - Compressed JPEG blob
 */
export function processImageFromCamera(videoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0)

  const img = new Image()
  img.src = canvas.toDataURL('image/jpeg')

  return resizeAndCompress(img)
}

/**
 * Resize and compress image to JPEG
 * Max dimensions: 240×360px (2x for retina displays)
 * Quality: 0.85
 * @param {HTMLImageElement} img - Image element
 * @returns {Blob} - Compressed JPEG blob
 */
function resizeAndCompress(img) {
  const MAX_WIDTH = 240
  const MAX_HEIGHT = 360

  let width = img.width
  let height = img.height

  // Calculate new dimensions maintaining aspect ratio
  if (width > height) {
    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width)
      width = MAX_WIDTH
    }
  } else {
    if (height > MAX_HEIGHT) {
      width = Math.round((width * MAX_HEIGHT) / height)
      height = MAX_HEIGHT
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      0.85
    )
  })
}
