/**
 * Layout and interaction for the built-in gallery: chips fit the panel, the
 * pressed ring follows the active preset, and removing the wallpaper clears it.
 */
import { chromium } from 'playwright-core'

const [url, outDir] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge', headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 200)))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 200)) })

  await page.goto(url, { waitUntil: 'commit', timeout: 60000 })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 })
  const settings = page.locator('button[aria-label*="设置"]').first()
  await settings.waitFor({ timeout: 40000 })
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(600)
  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) {
    await notice.first().click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(700)
  }
  await settings.click({ timeout: 8000 })
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: '外观' }).first().click({ timeout: 8000 })
  await page.waitForTimeout(900)

  const layout = await page.locator('.dshap-wallGrid').first().evaluate((grid) => {
    const chips = [...grid.querySelectorAll('.dshap-wallChip')].map((chip) => {
      const box = chip.getBoundingClientRect()
      return { width: Math.round(box.width), height: Math.round(box.height), ratio: Math.round((box.width / box.height) * 100) / 100 }
    })
    const panel = grid.closest('.dshap-item').getBoundingClientRect()
    const box = grid.getBoundingClientRect()
    return {
      chips,
      overflowX: Math.round(box.right - panel.right),
      rows: new Set(chips.map((chip) => chip.width)).size,
    }
  })
  console.log('layout:', JSON.stringify(layout))

  const grid = page.locator('.dshap-wallGrid').first()
  await grid.scrollIntoViewIfNeeded()
  await grid.screenshot({ path: `${outDir}/w3-gallery-crop.png` })

  const pressed = () => page.locator('.dshap-wallChip[aria-pressed="true"]').count()
  console.log('pressed on load:', await pressed())

  await page.locator('.dshap-wallChip').nth(2).click()
  await page.waitForTimeout(900)
  console.log('pressed after aurora:', await pressed(), JSON.stringify(await page.evaluate(() => JSON.parse(window.localStorage.getItem('dsh.appearance.v1')).background.preset)))

  // Removing the wallpaper must drop the pressed state with it.
  await page.getByRole('button', { name: '移除' }).first().click()
  await page.waitForTimeout(500)
  console.log('pressed after remove:', await pressed(), JSON.stringify(await page.evaluate(() => {
    const config = JSON.parse(window.localStorage.getItem('dsh.appearance.v1'))
    return { preset: config.background.preset, image: (window.localStorage.getItem('dsh.appearance.image.v1') ?? '').length }
  })))

  // Re-apply and check framing controls still work on a built-in.
  await page.locator('.dshap-wallChip').nth(0).click()
  await page.waitForTimeout(900)
  const zoom = page.locator('.dshap-slider input[type="range"]').first()
  // React tracks the value setter, so drive the native one before dispatching.
  await zoom.evaluate((node) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, '180')
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.waitForTimeout(400)
  console.log('after zoom:', JSON.stringify(await page.evaluate(() => {
    const config = JSON.parse(window.localStorage.getItem('dsh.appearance.v1'))
    return { preset: config.background.preset, zoom: config.background.zoom, size: getComputedStyle(document.body).backgroundSize }
  })))
  console.log('console errors:', JSON.stringify(errors))
} finally {
  await browser.close()
}
