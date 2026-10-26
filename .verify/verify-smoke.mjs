import { chromium } from 'playwright-core'
const [url, image, outDir] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })

  await page.goto(url, { waitUntil: 'commit' })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 })
  await page.waitForTimeout(500)
  const introAtStart = await page.evaluate(() => ({
    overlays: document.querySelectorAll('[data-scene]').length,
    scene: document.querySelector('[data-scene]')?.getAttribute('data-scene') ?? null,
    skipVisible: [...document.querySelectorAll('button')].some((b) => /跳过|Skip/.test(b.textContent ?? '')),
  }))
  console.log('intro at load:', JSON.stringify(introAtStart))
  await page.screenshot({ path: `${outDir}/g1-intro.png` })
  await page.waitForTimeout(4200)
  const introGone = await page.evaluate(() => document.querySelectorAll('[data-scene]').length)
  console.log('intro overlays after 4.7s:', introGone)

  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) { await notice.first().click().catch(() => {}); await page.waitForTimeout(800) }

  await page.locator('button[aria-label*="设置"]').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '外观' }).first().click()
  await page.waitForTimeout(900)
  await page.locator('.dshap-item input[type=file]').first().setInputFiles(image)
  await page.waitForTimeout(2800)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.reload({ waitUntil: 'commit' })
  await page.waitForTimeout(5200)
  const afterReload = await page.evaluate(() => ({
    overlays: document.querySelectorAll('[data-scene]').length,
    bodyImage: getComputedStyle(document.body).backgroundImage.slice(0, 40),
    size: getComputedStyle(document.body).backgroundSize,
    position: getComputedStyle(document.body).backgroundPosition,
    imageStored: (window.localStorage.getItem('dsh.appearance.image.v1') ?? '').length,
    config: window.localStorage.getItem('dsh.appearance.v1'),
  }))
  console.log('after reload:', JSON.stringify(afterReload, null, 2))
  await page.screenshot({ path: `${outDir}/g2-reload-wallpaper.png` })
  console.log('console errors:', JSON.stringify(errors))
} finally { await browser.close() }
