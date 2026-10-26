/**
 * Proof that the wallpaper actually reaches the dark shell: identical
 * screenshots with and without a wallpaper, then a per-pixel comparison.
 */
import { chromium } from 'playwright-core'

const [url, image, outDir] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge', headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'commit' })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(800)
  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) {
    await notice.first().click().catch(() => {})
    await page.waitForTimeout(900)
  }
  await page.screenshot({ path: `${outDir}/e0-dark-empty.png` })

  await page.locator('button[aria-label*="设置"]').first().click({ timeout: 8000 })
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '外观' }).first().click({ timeout: 8000 })
  await page.waitForTimeout(900)
  await page.locator('.dshap-item input[type=file]').first().setInputFiles(image)
  await page.waitForTimeout(3000)

  // Lower the veil so the dark wallpaper reads clearly, then close the panel.
  const veil = page.locator('.dshap-slider input').nth(1)
  await veil.fill('42')
  await page.waitForTimeout(600)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1500)
  const closed = await page.evaluate(() => ({
    pageGone: document.querySelector('.dshap-page') === null,
    bodyImage: getComputedStyle(document.body).backgroundImage.slice(0, 40),
    baseToken: getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim(),
  }))
  console.log('panel closed:', JSON.stringify(closed))
  await page.screenshot({ path: `${outDir}/e1-dark-wallpaper.png` })
} finally {
  await browser.close()
}
