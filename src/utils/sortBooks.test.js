import { describe, it, expect } from 'vitest'
import { getLastName, sortAuthors, getAvailableLetters, findAuthorForLetter } from './sortBooks'

describe('getLastName', () => {
  it('should return the last name from a two-word name', () => {
    expect(getLastName('Jane Austen')).toBe('Austen')
  })

  it('should return the last word as last name from three-word name', () => {
    expect(getLastName('F. Scott Fitzgerald')).toBe('Fitzgerald')
  })

  it('should return the last word from initial-based name', () => {
    expect(getLastName('J.D. Salinger')).toBe('Salinger')
  })

  it('should return the single word for single-name author', () => {
    expect(getLastName('Plato')).toBe('Plato')
  })
})

describe('sortAuthors', () => {
  it('should sort authors by last name (second word)', () => {
    const authors = ['George Orwell', 'Jane Austen', 'F. Scott Fitzgerald']
    const sorted = sortAuthors(authors)
    expect(sorted).toEqual(['Jane Austen', 'F. Scott Fitzgerald', 'George Orwell'])
  })

  it('should be case insensitive', () => {
    const authors = ['george orwell', 'JANE AUSTEN', 'f. scott fitzgerald']
    const sorted = sortAuthors(authors)
    expect(sorted).toEqual(['JANE AUSTEN', 'f. scott fitzgerald', 'george orwell'])
  })

  it('should handle single-name authors', () => {
    const authors = ['Plato', 'Jane Austen', 'Socrates']
    const sorted = sortAuthors(authors)
    expect(sorted).toEqual(['Jane Austen', 'Plato', 'Socrates'])
  })

  it('should handle mixed name formats', () => {
    const authors = [
      'Jane Austen',
      'F. Scott Fitzgerald',
      'Harper Lee',
      'George Orwell',
      'J.D. Salinger',
      'J.R.R. Tolkien'
    ]
    const sorted = sortAuthors(authors)
    expect(sorted).toEqual([
      'Jane Austen',
      'F. Scott Fitzgerald',
      'Harper Lee',
      'George Orwell',
      'J.D. Salinger',
      'J.R.R. Tolkien'
    ])
  })
})

describe('getAvailableLetters', () => {
  it('should return letters from last name initials', () => {
    const authors = ['Jane Austen', 'F. Scott Fitzgerald', 'Harper Lee']
    const letters = getAvailableLetters(authors)
    expect(letters).toContain('A')
    expect(letters).toContain('F')
    expect(letters).toContain('L')
  })

  it('should use last name initials (second word)', () => {
    const authors = ['123 Author', '@ Another', 'George Orwell']
    const letters = getAvailableLetters(authors)
    expect(letters).toContain('A')
    expect(letters).toContain('O')
  })

  it('should return empty set for empty array', () => {
    const letters = getAvailableLetters([])
    expect(letters.size).toBe(0)
  })
})

describe('findAuthorForLetter', () => {
  it('should find first author by last name initial', () => {
    const authors = ['Jane Austen', 'F. Scott Fitzgerald', 'Harper Lee', 'George Orwell']
    const found = findAuthorForLetter('O', authors)
    expect(found).toBe('George Orwell')
  })

  it('should return first author when multiple match', () => {
    const authors = ['Jane Austen', 'Another Author', 'F. Scott Fitzgerald']
    const found = findAuthorForLetter('A', authors)
    expect(found).toBe('Jane Austen')
  })

  it('should return undefined for non-matching letter', () => {
    const authors = ['Jane Austen', 'F. Scott Fitzgerald', 'Harper Lee']
    const found = findAuthorForLetter('Z', authors)
    expect(found).toBeUndefined()
  })

  it('should return undefined when no authors have non-alphabetic last names', () => {
    const authors = ['Jane Austen', '123 Author', 'F. Scott Fitzgerald']
    const found = findAuthorForLetter('#', authors)
    expect(found).toBeUndefined()
  })

  it('should return undefined when no # authors exist', () => {
    const authors = ['Jane Austen', 'F. Scott Fitzgerald', 'Harper Lee']
    const found = findAuthorForLetter('#', authors)
    expect(found).toBeUndefined()
  })
})
