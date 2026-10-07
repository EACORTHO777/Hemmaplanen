import { test, expect } from '@playwright/test'

test('demo: add an item and check it off', async ({ page }) => {
  await page.goto('/')

  // Start the demo
  await page.getByRole('button', { name: 'Prova demo' }).click()

  // Add an item through the quick-add field
  const input = page.getByLabel('Lägg till vara')
  await input.fill('Testost')
  await input.press('Enter')

  // The new item shows up in the list
  const item = page.getByRole('checkbox', { name: /Testost/ })
  await expect(item).toBeVisible()

  // Check it off
  await item.click()
  await expect(item).toBeChecked()
})
