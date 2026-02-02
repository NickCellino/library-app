import { test, expect } from '@playwright/test'

// Mock Google Books API responses
const MOCK_GATSBY = {
  totalItems: 1,
  items: [{
    volumeInfo: {
      title: 'The Great Gatsby',
      authors: ['F. Scott Fitzgerald'],
      publishedDate: '2004-09-29',
      publisher: 'Scribner',
      pageCount: 180,
      imageLinks: { thumbnail: 'https://example.com/new-gatsby-cover.jpg' }
    }
  }]
}

const MOCK_ORWELL = {
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
  test.beforeEach(async ({ page }) => {
    // Mock Google Books API
    await page.route('**/googleapis.com/books/**', route => {
      const url = route.request().url()
      if (url.includes('isbn:9780743273565')) {
        route.fulfill({ json: MOCK_GATSBY })
      } else if (url.includes('intitle:The+Great+Gatsby+inauthor:F.+Scott+Fitzgerald')) {
        route.fulfill({ json: MOCK_GATSBY })
      } else if (url.includes('intitle:1984+inauthor:George+Orwell')) {
        route.fulfill({ json: MOCK_ORWELL })
      } else {
        route.fulfill({ json: { totalItems: 0 } })
      }
    })

    // Navigate with testMode=true
    await page.goto(`http://localhost:5173/?testMode=true`)

    // Wait for app to load
    await page.waitForSelector('.fab', { timeout: 10000 })
  })

  test('should show Reset Image button for book with ISBN', async ({ page }) => {
    // First add a book via test mode
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await page.locator('[data-testid="test-scan-the-great-gatsby"]').click()
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Done")')

    // Click on the book to open details
    await page.locator('.book-row:has-text("The Great Gatsby")').click()
    await expect(page.locator('.detail-modal')).toBeVisible()

    // Click Edit button
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.locator('.modal-content')).toBeVisible()

    // Should show Reset Image button in edit mode
    await expect(page.locator('button:has-text("Reset Image")')).toBeVisible()
  })

  test('should reset cover using ISBN when available', async ({ page }) => {
    // Add a book first
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await page.locator('[data-testid="test-scan-the-great-gatsby"]').click()
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Done")')

    // Edit the book
    await page.locator('.book-row:has-text("The Great Gatsby")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Verify current cover exists
    await expect(page.locator('.cover-preview img')).toBeVisible()

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Should show loading state
    await expect(page.locator('button:has-text("Resetting...")')).toBeVisible()

    // After reset, cover should be updated (mock URL will be different)
    await expect(page.locator('.cover-preview img')).toHaveAttribute('src', 'https://example.com/new-gatsby-cover.jpg')
  })

  test('should show Reset Image button for book without ISBN but with title and author', async ({ page }) => {
    // Add a book manually without ISBN
    await page.getByRole('button', { name: /add book/i }).click()
    await page.waitForSelector('.modal-content')
    
    await page.fill('#title', '1984')
    await page.fill('#author', 'George Orwell')
    await page.getByRole('button', { name: 'Add Book' }).click()

    // Edit the book
    await page.locator('.book-row:has-text("1984")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Should show Reset Image button even without ISBN
    await expect(page.locator('button:has-text("Reset Image")')).toBeVisible()
  })

  test('should reset cover using title and author when no ISBN', async ({ page }) => {
    // Add a book manually without ISBN
    await page.getByRole('button', { name: /add book/i }).click()
    await page.waitForSelector('.modal-content')
    
    await page.fill('#title', '1984')
    await page.fill('#author', 'George Orwell')
    await page.getByRole('button', { name: 'Add Book' }).click()

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
    await page.getByRole('button', { name: /add book/i }).click()
    await page.waitForSelector('.modal-content')

    // Should not show Reset Image button in add mode
    await expect(page.locator('button:has-text("Reset Image")')).not.toBeVisible()
  })

  test('should not show Reset Image button when insufficient data', async ({ page }) => {
    await page.getByRole('button', { name: /add book/i }).click()
    await page.waitForSelector('.modal-content')
    
    // Fill only title, no author
    await page.fill('#title', 'Some Book')
    
    // Switch to edit mode by adding then editing
    await page.getByRole('button', { name: 'Add Book' }).click()
    
    // Edit the book
    await page.locator('.book-row:has-text("Some Book")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Should not show Reset Image button (no ISBN, no author)
    await expect(page.locator('button:has-text("Reset Image")')).not.toBeVisible()
  })

  test('should handle no cover found gracefully', async ({ page }) => {
    // Mock empty response for this test
    await page.route('**/googleapis.com/books/**', route => {
      route.fulfill({ json: { totalItems: 0 } })
    })

    // Add a book first
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await page.locator('[data-testid="test-scan-the-great-gatsby"]').click()
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Done")')

    // Edit the book
    await page.locator('.book-row:has-text("The Great Gatsby")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Should show error alert
    await expect(page.locator('text=No cover image found')).toBeVisible()
  })

  test('should disable Reset Image button during operation', async ({ page }) => {
    // Add a book first
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await page.locator('[data-testid="test-scan-the-great-gatsby"]').click()
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Done")')

    // Edit the book
    await page.locator('.book-row:has-text("The Great Gatsby")').click()
    await page.getByRole('button', { name: 'Edit' }).click()

    // Click Reset Image button
    await page.getByRole('button', { name: 'Reset Image' }).click()

    // Button should be disabled during reset
    await expect(page.locator('button:has-text("Resetting...")')).toBeDisabled()
  })
})