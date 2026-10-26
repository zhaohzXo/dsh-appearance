import { chromium } from 'playwright-core'
const [url, outDir] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  await page.goto(url, { waitUntil: 'commit' })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(800)
  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) { await notice.first().click().catch(() => {}); await page.waitForTimeout(800) }
  await page.locator('button[aria-label*="设置"]').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '外观' }).first().click()
  await page.waitForTimeout(900)

  // 1. Invalid input must surface the inline error, not silently apply.
  await page.locator('.dshap-urlInput').fill('not-a-url')
  await page.getByRole('button', { name: '载入' }).click()
  await page.waitForTimeout(400)
  console.log('invalid url error shown:', await page.locator('.dshap-error').count())

  // 2. Plain HTTP without CORS headers: the wallpaper must still apply.
  await page.locator('.dshap-urlInput').fill('http://127.0.0.1:59994/wallpaper.jpg')
  await page.getByRole('button', { name: '载入' }).click()
  await page.waitForTimeout(2500)
  console.log(JSON.stringify(await page.evaluate(() => {
    const style = getComputedStyle(document.body)
    return {
      image: style.backgroundImage.slice(0, 70),
      size: style.backgroundSize,
      position: style.backgroundPosition,
      config: window.localStorage.getItem('dsh.appearance.v1'),
    }
  }), null, 2))
  await page.screenshot({ path: `${outDir}/e2-dark-http-url.png` })

  // 3. Status of the image load (did the CORS measurement succeed?).
  console.log('url probe:', JSON.stringify(await page.evaluate(async () => {
    const value = 'http://127.0.0.1:59994/wallpaper.jpg'
    const result = await new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve({ ok: true, w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve({ ok: false })
      img.src = value
    })
    return result
  })))
  console.log('console errors:', JSON.stringify(errors))
} finally { await browser.close() }
