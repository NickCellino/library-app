import { test, expect } from '@playwright/test'

// Mock Google Books API responses
const MOCK_ULYSSES = {
  totalItems: 1,
  items: [{
    volumeInfo: {
      title: 'Ulysses',
      authors: ['James Joyce'],
      publishedDate: '1922-02-02',
      publisher: 'Vintage',
      pageCount: 783,
      imageLinks: { thumbnail: 'https://example.com/new-ulysses-cover.jpg' }
    }
  }]
}

const MOCK_1984 = {
  totalItems: 1,
  items: [{
    volumeInfo: {
      title: '1984',
      authors: ['George Orwell'],
      publishedDate: '1949-06-08',
      publisher: 'Secker & Warburg',
      pageCount: 328,
      imageLinks: { thumbnail: 'https://example.com/new-1984-cover.jpg' }
    }
  }]
}

test.describe('Reset Book Cover Feature', () => {
  // Helper to add book via hamburger menu
  async function addBookViaMenu(page, { title, author, isbn }) {
    // Open hamburger menu
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('button', { name: 'Add Book' }).click()
    await page.waitForSelector('.modal-content')

    await page.fill('#title', title)
    if (author) await page.fill('#author', author)
    if (isbn) await page.fill('#isbn', isbn)
    await page.getByRole('button', { name: 'Add Book' }).click()
  }

  test('should show Reset Image button for book with ISBN', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book manually with ISBN
    await addBookViaMenu(page, { title: 'Ulysses', author: 'James Joyce', isbn: '9780679722762' })

    // Click on the book to open details
    await page.locator('.book-row:has-text("Ulysses")').click()
    await expect(page.locator('.detail-modal')).toBeVisible()

    // Click Edit button
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.locator('.modal-content')).toBeVisible()

    // Should show Reset Image button in edit mode
    await expect(page.locator('button:has-text("Reset Image")')).toBeVisible()
  })

  test('should reset cover using ISBN when available', async ({ page }) => {
    // Set up route mock BEFORE navigation - use regex for more reliable matching
    await page.route(/googleapis\.com\/books/, route => {
      route.fulfill({ json: MOCK_ULYSSES })
    })

    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book manually
    await addBookViaMenu(page, { title: 'Ulysses', author: 'James Joyce', isbn: '9780679722762' })

    // Edit the book
    await page.locator('.book-row:has-text("Ulysses")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Should show loading state
    await expect(page.locator('button:has-text("Resetting...")')).toBeVisible()

    // After reset, cover should be updated (mock URL)
    await expect(page.locator('.cover-preview img')).toHaveAttribute('src', 'https://example.com/new-ulysses-cover.jpg')
  })

  test('should show Reset Image button for book without ISBN but with title and author', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book manually without ISBN
    await addBookViaMenu(page, { title: '1984', author: 'George Orwell' })

    // Edit the book
    await page.locator('.book-row:has-text("1984")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Should show Reset Image button even without ISBN
    await expect(page.locator('button:has-text("Reset Image")')).toBeVisible()
  })

  test('should reset cover using title and author when no ISBN', async ({ page }) => {
    // Set up route mock BEFORE navigation - use regex for more reliable matching
    await page.route(/googleapis\.com\/books/, route => {
      route.fulfill({ json: MOCK_1984 })
    })

    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book manually without ISBN
    await addBookViaMenu(page, { title: '1984', author: 'George Orwell' })

    // Edit the book
    await page.locator('.book-row:has-text("1984")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Should show loading state
    await expect(page.locator('button:has-text("Resetting...")')).toBeVisible()

    // After reset, cover should be updated
    await expect(page.locator('.cover-preview img')).toHaveAttribute('src', 'https://example.com/new-1984-cover.jpg')
  })

  test('should not show Reset Image button in add mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Open hamburger menu and click Add Book
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('button', { name: 'Add Book' }).click()
    await page.waitForSelector('.modal-content')

    // Should not show Reset Image button in add mode
    await expect(page.locator('button:has-text("Reset Image")')).not.toBeVisible()
  })

  test('Reset Image button requires ISBN or title+author', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book with title and author (required by form), no ISBN
    await addBookViaMenu(page, { title: 'Test Book', author: 'Test Author' })

    // Edit the book
    await page.locator('.book-row:has-text("Test Book")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Should show Reset Image button because we have title+author
    await expect(page.locator('button:has-text("Reset Image")')).toBeVisible()

    // Clear the author field to test insufficient data
    await page.fill('#author', '')

    // Reset Image button should disappear when author is cleared
    await expect(page.locator('button:has-text("Reset Image")')).not.toBeVisible()
  })

  test('should handle no cover found gracefully', async ({ page }) => {
    // Mock empty response BEFORE navigation - use regex for more reliable matching
    await page.route(/googleapis\.com\/books/, route => {
      route.fulfill({ json: { totalItems: 0 } })
    })

    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book manually
    await addBookViaMenu(page, { title: 'Ulysses', author: 'James Joyce', isbn: '9780679722762' })

    // Edit the book
    await page.locator('.book-row:has-text("Ulysses")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Set up dialog handler for alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('No cover image found')
      await dialog.accept()
    })

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Wait for loading to finish
    await expect(page.locator('button:has-text("Reset Image")')).toBeVisible({ timeout: 10000 })
  })

  test('should disable Reset Image button during operation', async ({ page }) => {
    // Set up route mock with delay - use regex for more reliable matching
    await page.route(/googleapis\.com\/books/, async route => {
      await new Promise(r => setTimeout(r, 1000))
      route.fulfill({ json: MOCK_ULYSSES })
    })

    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })

    // Add a book manually
    await addBookViaMenu(page, { title: 'Ulysses', author: 'James Joyce', isbn: '9780679722762' })

    // Edit the book
    await page.locator('.book-row:has-text("Ulysses")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Button should be disabled during reset
    await expect(page.locator('button:has-text("Resetting...")')).toBeDisabled()
  })
})
