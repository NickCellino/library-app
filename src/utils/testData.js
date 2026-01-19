import { v4 as uuidv4 } from 'uuid'

export const generateTestBooks = () => [
  {
    id: uuidv4(),
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg',
    publishYear: 1925,
    publisher: 'Scribner',
    pageCount: 180,
    dateAdded: new Date('2026-01-15').toISOString()
  },
  {
    id: uuidv4(),
    title: 'Tender Is the Night',
    author: 'F. Scott Fitzgerald',
    isbn: '9780684801544',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780684801544-M.jpg',
    publishYear: 1934,
    publisher: 'Scribner',
    pageCount: 320,
    dateAdded: new Date('2026-01-16').toISOString()
  },
  {
    id: uuidv4(),
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg',
    publishYear: 1949,
    publisher: 'Signet Classic',
    pageCount: 328,
    dateAdded: new Date('2026-01-10').toISOString()
  },
  {
    id: uuidv4(),
    title: 'Animal Farm',
    author: 'George Orwell',
    isbn: '9780451526342',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780451526342-M.jpg',
    publishYear: 1945,
    publisher: 'Signet Classic',
    pageCount: 112,
    dateAdded: new Date('2026-01-11').toISOString()
  },
  {
    id: uuidv4(),
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg',
    publishYear: 1960,
    publisher: 'Harper Perennial',
    pageCount: 324,
    dateAdded: new Date('2026-01-12').toISOString()
  },
  {
    id: uuidv4(),
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '9780141439518',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg',
    publishYear: 1813,
    publisher: 'Penguin Classics',
    pageCount: 432,
    dateAdded: new Date('2026-01-13').toISOString()
  },
  {
    id: uuidv4(),
    title: 'Emma',
    author: 'Jane Austen',
    isbn: '9780141439587',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780141439587-M.jpg',
    publishYear: 1815,
    publisher: 'Penguin Classics',
    pageCount: 474,
    dateAdded: new Date('2026-01-14').toISOString()
  },
  {
    id: uuidv4(),
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    isbn: '9780316769488',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780316769488-M.jpg',
    publishYear: 1951,
    publisher: 'Little, Brown and Company',
    pageCount: 234,
    dateAdded: new Date('2026-01-17').toISOString()
  },
  {
    id: uuidv4(),
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '9780547928227',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg',
    publishYear: 1937,
    publisher: 'Houghton Mifflin Harcourt',
    pageCount: 310,
    dateAdded: new Date('2026-01-18').toISOString()
  },
  {
    id: uuidv4(),
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    isbn: '9780544003415',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780544003415-M.jpg',
    publishYear: 1954,
    publisher: 'Houghton Mifflin Harcourt',
    pageCount: 1178,
    dateAdded: new Date('2026-01-19').toISOString()
  }
]
