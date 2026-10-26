/**
 * Built-in wallpapers: the gallery must render all presets, applying one must
 * store a full-size image plus its preset key, and the choice must survive a
 * reload. Full-size renders are written out for a visual check.
 */
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

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
  await page.waitForTimeout(800)

  const chips = page.locator('.dshap-wallChip')
  const count = await chips.count()
  const labels = await chips.evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''))
  const thumbs = await chips.evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node).backgroundImage
    return style.startsWith('url("data:image/webp') ? style.length : 0
  }))
  console.log('gallery:', JSON.stringify({ count, labels, thumbDataUrls: thumbs.length, allThumbs: thumbs.every((size) => size > 500) }))
  await page.locator('.dshap-wallHead').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${outDir}/w0-gallery.png` })

  const keys = ['dusk', 'dawn', 'aurora', 'nebula', 'dunes', 'gradient']
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]
    await chips.nth(index).click()
    await page.waitForTimeout(900)
    const state = await page.evaluate(() => {
      const image = window.localStorage.getItem('dsh.appearance.image.v1') ?? ''
      const config = JSON.parse(window.localStorage.getItem('dsh.appearance.v1') ?? '{}')
      return {
        length: image.length,
        media: image.slice(0, 24),
        preset: config.background?.preset ?? null,
        size: getComputedStyle(document.body).backgroundSize,
        pressed: document.querySelectorAll('.dshap-wallChip[aria-pressed="true"]').length,
      }
    })
    const payload = await page.evaluate(() => window.localStorage.getItem('dsh.appearance.image.v1') ?? '')
    const base64 = payload.split(',')[1] ?? ''
    const extension = payload.startsWith('data:image/webp') ? 'webp' : 'jpg'
    writeFileSync(`${outDir}/wall-${key}.${extension}`, Buffer.from(base64, 'base64'))
    console.log(key, JSON.stringify(state))
    if (index === 0) await page.screenshot({ path: `${outDir}/w1-applied.png` })
  }

  // Last applied preset must come back after a reload.
  await page.reload({ waitUntil: 'commit' })
  await page.waitForTimeout(4500)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(600)
  const restored = await page.evaluate(() => {
    const config = JSON.parse(window.localStorage.getItem('dsh.appearance.v1') ?? '{}')
    return {
      preset: config.background?.preset ?? null,
      bodyImage: getComputedStyle(document.body).backgroundImage.slice(0, 30),
      size: getComputedStyle(document.body).backgroundSize,
    }
  })
  console.log('after reload:', JSON.stringify(restored))
  await page.screenshot({ path: `${outDir}/w2-reload.png` })
  console.log('console errors:', JSON.stringify(errors))
} finally {
  await browser.close()
}
