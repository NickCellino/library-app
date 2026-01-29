import vision from '@google-cloud/vision'

const client = new vision.ImageAnnotatorClient()

/**
 * Extract text from image using Cloud Vision API
 * @param {string} base64Image - Base64 encoded image (without data URI prefix)
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromImage(base64Image) {
  const request = {
    image: {
      content: base64Image
    },
    features: [
      { type: 'TEXT_DETECTION' }
    ]
  }

  const [result] = await client.annotateImage(request)

  if (result.error) {
    throw new Error(`Vision API error: ${result.error.message}`)
  }

  const textAnnotations = result.textAnnotations
  if (!textAnnotations || textAnnotations.length === 0) {
    return ''
  }

  // First annotation is full text, rest are individual words
  return textAnnotations[0].description || ''
}
