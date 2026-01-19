import JsBarcode from 'jsbarcode'
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '../public/test-barcodes')

const barcodes = [
  { isbn: '9780743273565', title: 'The Great Gatsby' },
  { isbn: '9780451524935', title: '1984' },
]

mkdirSync(outputDir, { recursive: true })

for (const { isbn, title } of barcodes) {
  const canvas = createCanvas(300, 150)
  JsBarcode(canvas, isbn, {
    format: 'EAN13',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 16,
    margin: 10,
  })

  const buffer = canvas.toBuffer('image/png')
  const outputPath = join(outputDir, `${isbn}.png`)
  writeFileSync(outputPath, buffer)
  console.log(`Generated: ${outputPath} (${title})`)
}

console.log('Done!')
