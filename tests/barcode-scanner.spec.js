import { test, expect } from '@playwright/test'

// Mock Google Books API responses for video fixture ISBNs
const MOCK_ULYSSES = {
  totalItems: 1,
  items: [{
    volumeInfo: {
      title: 'Ulysses',
      authors: ['James Joyce'],
      publishedDate: '1922-02-02',
      publisher: 'Vintage',
      pageCount: 783,
      imageLinks: { thumbnail: 'https://example.com/ulysses.jpg' }
    }
  }]
}

const MOCK_CREATIVE_ACT = {
  totalItems: 1,
  items: [{
    volumeInfo: {
      title: 'The Creative Act',
      authors: ['Rick Rubin'],
      publishedDate: '2023-01-17',
      publisher: 'Penguin Press',
      pageCount: 432,
      imageLinks: { thumbnail: 'https://example.com/creative-act.jpg' }
    }
  }]
}

test.describe('Barcode Scanner Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Google Books API for video fixture ISBNs
    // Video shows Ulysses first, then Creative Act
    await page.route('**/googleapis.com/books/**', route => {
      const url = route.request().url()
      if (url.includes('9780679722762')) {
        route.fulfill({ json: MOCK_ULYSSES })
      } else if (url.includes('9780593652886')) {
        route.fulfill({ json: MOCK_CREATIVE_ACT })
      } else {
        route.fulfill({ json: { totalItems: 0 } })
      }
    })

    // Navigate (anonymous auth provides unique user per session)
    await page.goto('http://localhost:5173/')
    await page.waitForSelector('.fab', { timeout: 10000 })
  })

  test('should open scanner modal with camera view', async ({ page }) => {
    await page.getByRole('button', { name: /scan barcode/i }).click()

    await expect(page.locator('.scanner-modal')).toBeVisible()
    // Should show footer with Done button
    await expect(page.locator('.scanner-footer')).toBeVisible()
    await expect(page.locator('button:has-text("Done")')).toBeVisible()
    // Camera view should be active
    await expect(page.locator('.scanner-view')).toBeVisible()
  })

  test('should scan Ulysses and auto-add with toast', async ({ page }) => {
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // Wait for barcode detection from fake video (Ulysses appears first)
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.toast-title:has-text("Ulysses")')).toBeVisible()
    await expect(page.locator('.toast-author:has-text("James Joyce")')).toBeVisible()
    await expect(page.locator('.toast-status:has-text("Added")')).toBeVisible()

    // Counter should update
    await expect(page.locator('.scanner-count:has-text("Added: 1 book")')).toBeVisible()
  })

  test('should add book to library and show in list after Done', async ({ page }) => {
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // Wait for scan
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 30000 })

    // Click Done to close modal
    await page.click('button:has-text("Done")')

    // Modal should close
    await expect(page.locator('.scanner-modal')).not.toBeVisible()

    // Book should appear in library
    await expect(page.locator('.book-row:has-text("Ulysses")')).toBeVisible()
  })

  test('should scan multiple books continuously', async ({ page }) => {
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // First book (Ulysses)
    await expect(page.locator('.toast-title:has-text("Ulysses")')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.scanner-count:has-text("Added: 1 book")')).toBeVisible()

    // Wait for toast to auto-dismiss, video continues to Creative Act barcode
    await page.waitForTimeout(3000)

    // Second book (Creative Act)
    await expect(page.locator('.toast-title:has-text("The Creative Act")')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.scanner-count:has-text("Added: 2 books")')).toBeVisible()

    // Close and verify both books in library
    await page.click('button:has-text("Done")')
    await expect(page.locator('.book-row:has-text("Ulysses")')).toBeVisible()
    await expect(page.locator('.book-row:has-text("The Creative Act")')).toBeVisible()
  })

  test('should show duplicate toast with action buttons', async ({ page }) => {
    // First add a book via scanner
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 30000 })

    // Close modal
    await page.click('button:has-text("Done")')
    await expect(page.locator('.scanner-modal')).not.toBeVisible()

    // Wait a moment then reopen
    await page.waitForTimeout(500)

    // Try to scan same book again (video loops back to Ulysses)
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // Should show duplicate toast with action buttons
    await expect(page.locator('.scan-toast-duplicate')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.toast-status-warn:has-text("Already in library")')).toBeVisible()
    await expect(page.locator('.toast-btn-secondary:has-text("Keep Scanning")')).toBeVisible()
    await expect(page.locator('.toast-btn-primary:has-text("Add Anyway")')).toBeVisible()

    // Counter should still be 0 (not added)
    await expect(page.locator('.scanner-count:has-text("Added: 0 books")')).toBeVisible()
  })

  test('should not auto-dismiss duplicate toast', async ({ page }) => {
    // First scan both books
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await expect(page.locator('.toast-title:has-text("Ulysses")')).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(3000) // Wait for toast to dismiss
    await expect(page.locator('.toast-title:has-text("The Creative Act")')).toBeVisible({ timeout: 30000 })

    // Close modal
    await page.click('button:has-text("Done")')
    await expect(page.locator('.scanner-modal')).not.toBeVisible()

    // Wait a moment then reopen - video loops back to Ulysses
    await page.waitForTimeout(500)

    // Try to scan Ulysses again (duplicate)
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // Should show duplicate toast
    await expect(page.locator('.scan-toast-duplicate')).toBeVisible({ timeout: 30000 })

    // Wait 5 seconds - toast should still be visible
    await page.waitForTimeout(5000)
    await expect(page.locator('.scan-toast-duplicate')).toBeVisible()
    await expect(page.locator('.toast-btn-primary:has-text("Add Anyway")')).toBeVisible()
  })

  test('should dismiss duplicate toast with "Keep Scanning" button', async ({ page }) => {
    // First scan both books
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await expect(page.locator('.toast-title:has-text("Ulysses")')).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(3000) // Wait for toast to dismiss
    await expect(page.locator('.toast-title:has-text("The Creative Act")')).toBeVisible({ timeout: 30000 })

    // Close modal
    await page.click('button:has-text("Done")')
    await expect(page.locator('.scanner-modal')).not.toBeVisible()

    // Wait a moment then reopen - video loops back to Ulysses
    await page.waitForTimeout(500)

    // Try to scan Ulysses again (duplicate)
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // Should show duplicate toast
    await expect(page.locator('.scan-toast-duplicate')).toBeVisible({ timeout: 30000 })

    // Click "Keep Scanning"
    await page.click('.toast-btn-secondary:has-text("Keep Scanning")')

    // Toast should disappear
    await expect(page.locator('.scan-toast-duplicate')).not.toBeVisible()

    // Counter should still be 0
    await expect(page.locator('.scanner-count:has-text("Added: 0 books")')).toBeVisible()
  })

  test('should allow adding duplicate via "Add Anyway" button', async ({ page }) => {
    // First scan both books
    await page.getByRole('button', { name: /scan barcode/i }).click()
    await expect(page.locator('.toast-title:has-text("Ulysses")')).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(3000) // Wait for toast to dismiss
    await expect(page.locator('.toast-title:has-text("The Creative Act")')).toBeVisible({ timeout: 30000 })

    // Close modal
    await page.click('button:has-text("Done")')
    await expect(page.locator('.scanner-modal')).not.toBeVisible()

    // Wait a moment then reopen - video loops, may show either book
    await page.waitForTimeout(500)

    // Try to scan again (duplicate)
    await page.getByRole('button', { name: /scan barcode/i }).click()

    // Should show duplicate toast
    await expect(page.locator('.scan-toast-duplicate')).toBeVisible({ timeout: 30000 })

    // Get which book is being shown as duplicate
    const toastTitle = await page.locator('.scan-toast-duplicate .toast-title').textContent()

    // Click "Add Anyway"
    await page.click('.toast-btn-primary:has-text("Add Anyway")')

    // Should show success toast
    await expect(page.locator('.scan-toast-success')).toBeVisible({ timeout: 10000 })

    // Counter should increment to 1
    await expect(page.locator('.scanner-count:has-text("Added: 1 book")')).toBeVisible()

    // Close and verify 2 copies of the duplicate book in library
    await page.click('button:has-text("Done")')
    const duplicateBooks = page.locator(`.book-row:has-text("${toastTitle}")`)
    await expect(duplicateBooks).toHaveCount(2)
  })
})
