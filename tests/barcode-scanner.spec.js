import { test, expect } from '@playwright/test'

test.describe('Barcode Scanner Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Start the dev server and navigate to it
    await page.goto('http://localhost:5173')
  })

  test('should open scanner modal', async ({ page }) => {
    // Click the "Scan Barcode" button
    await page.click('text=Scan Barcode')

    // Verify modal is open
    await expect(page.locator('.scanner-modal')).toBeVisible()
    await expect(page.locator('text=Scan Barcode')).toBeVisible()
  })

  test('should fetch book data using test ISBN button', async ({ page }) => {
    console.log('Opening scanner modal...')

    // Click the "Scan Barcode" button
    await page.click('text=Scan Barcode')

    console.log('Modal opened, looking for test button...')

    // Wait for the test button to be visible
    const testButton = page.locator('text=Test with Sample ISBN')
    await expect(testButton).toBeVisible()

    console.log('Clicking test button...')

    // Set up console log listener to capture debug messages
    page.on('console', msg => {
      console.log(`Browser console: ${msg.text()}`)
    })

    // Click the test button
    await testButton.click()

    console.log('Waiting for loading state...')

    // Should show loading state
    await expect(page.locator('text=Fetching book details...')).toBeVisible({ timeout: 5000 })

    console.log('Loading state visible, waiting for results...')

    // Wait for book data to load (with generous timeout for API call)
    await expect(page.locator('text=The Great Gatsby')).toBeVisible({ timeout: 10000 })

    console.log('Book title visible!')

    // Verify book details are shown
    await expect(page.locator('text=F. Scott Fitzgerald')).toBeVisible()

    console.log('Author visible!')

    // Verify the "Add to Library" button is present
    await expect(page.locator('text=Add to Library')).toBeVisible()

    console.log('Add to Library button visible!')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept the API call and make it fail
    await page.route('**/googleapis.com/books/**', route => {
      route.abort()
    })

    // Click the "Scan Barcode" button
    await page.click('text=Scan Barcode')

    // Click the test button
    await page.click('text=Test with Sample ISBN')

    // Should show error message
    await expect(page.locator('text=Failed to fetch book data')).toBeVisible({ timeout: 5000 })
  })

  test('should allow adding book to library after successful scan', async ({ page }) => {
    // Click the "Scan Barcode" button
    await page.click('text=Scan Barcode')

    // Click the test button
    await page.click('text=Test with Sample ISBN')

    // Wait for book data to load
    await expect(page.locator('text=The Great Gatsby')).toBeVisible({ timeout: 10000 })

    // Click "Add to Library"
    await page.click('text=Add to Library')

    // Modal should close and book should appear in the list
    await expect(page.locator('.scanner-modal')).not.toBeVisible()

    // Verify book was added to the library
    await expect(page.locator('text=The Great Gatsby')).toBeVisible()
    await expect(page.locator('text=F. Scott Fitzgerald')).toBeVisible()
  })

  test('should allow scanning another book after successful scan', async ({ page }) => {
    // Click the "Scan Barcode" button
    await page.click('text=Scan Barcode')

    // Click the test button
    await page.click('text=Test with Sample ISBN')

    // Wait for book data to load
    await expect(page.locator('text=The Great Gatsby')).toBeVisible({ timeout: 10000 })

    // Click "Scan Another"
    await page.click('text=Scan Another')

    // Should be back at the initial state
    await expect(page.locator('text=Start Camera')).toBeVisible()
    await expect(page.locator('text=The Great Gatsby')).not.toBeVisible()
  })
})
