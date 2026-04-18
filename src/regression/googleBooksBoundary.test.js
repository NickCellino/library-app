import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const guardedDirectories = ['src', 'tests']
const ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'coverage', 'functions'])
const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.md', '.json'])

const forbiddenPatterns = [
  /googleapis\.com\/books/i,
  /www\.googleapis\.com\/books/i,
  /books\/v1\/volumes/i,
  /src\/utils\/googleBooksApi\.js/i,
  /src\/utils\/bookCoverSearch\.js/i,
]

function collectTextFiles(directoryPath) {
  const entries = readdirSync(directoryPath)
  const files = []

  for (const entry of entries) {
    if (ignoredDirectories.has(entry)) {
      continue
    }

    const entryPath = path.join(directoryPath, entry)
    const stats = statSync(entryPath)

    if (stats.isDirectory()) {
      files.push(...collectTextFiles(entryPath))
      continue
    }

    if (textExtensions.has(path.extname(entryPath))) {
      files.push(entryPath)
    }
  }

  return files
}

describe('Google Books browser boundary', () => {
  it('does not allow direct browser-side Google Books references back into src or tests', () => {
    const violations = []

    for (const directory of guardedDirectories) {
      const absoluteDirectory = path.join(projectRoot, directory)
      const files = collectTextFiles(absoluteDirectory)

      for (const filePath of files) {
        const contents = readFileSync(filePath, 'utf8')
        const matchedPattern = forbiddenPatterns.find(pattern => pattern.test(contents))

        if (matchedPattern) {
          violations.push(`${path.relative(projectRoot, filePath)} matched ${matchedPattern}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
