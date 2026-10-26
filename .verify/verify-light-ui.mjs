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
  await page.waitForTimeout(1600)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(800)
  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) { await notice.first().click().catch(() => {}); await page.waitForTimeout(800) }
  await page.locator('button[aria-label*="设置"]').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '外观' }).first().click()
  await page.waitForTimeout(900)
  console.log('light tokens:', JSON.stringify(await page.evaluate(() => {
    const s = getComputedStyle(document.body)
    return {
      base: s.getPropertyValue('--dsw-alias-bg-base').trim(),
      layer2: s.getPropertyValue('--dsw-alias-bg-layer-2').trim(),
      label: s.getPropertyValue('--dsw-alias-label-primary').trim(),
    }
  })))
  await page.locator('.dshap-ddBtn').first().click()
  await page.waitForTimeout(500)
  console.log('dropdown (light):', JSON.stringify(await page.evaluate(() => {
    const menu = document.querySelector('.dshap-ddMenu')
    const option = menu?.querySelector('.dshap-ddOption')
    const trigger = document.querySelector('.dshap-ddBtn')
    const parse = (value) => value.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
    return {
      menuBackground: getComputedStyle(menu).backgroundColor,
      optionColor: getComputedStyle(option).color,
      optionBackground: getComputedStyle(option).backgroundColor,
      triggerBackground: getComputedStyle(trigger).backgroundColor,
      contrast: Number(contrast(parse(getComputedStyle(option).color), parse(getComputedStyle(menu).backgroundColor)).toFixed(2)),
      toggles: document.querySelectorAll('.dshap-toggle').length,
      swatches: document.querySelectorAll('.dshap-dd .dshap-swatch').length,
    }
  })))
  await page.screenshot({ path: `${outDir}/f1-light-dropdown.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${outDir}/f2-light-settings.png` })
  console.log('console errors:', JSON.stringify(errors))
} finally { await browser.close() }
