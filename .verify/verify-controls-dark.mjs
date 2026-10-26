/**
 * Controls must be legible in a dark shell: the filled action button keeps a
 * dark label on its light fill, and a checked switch shows a contrasting thumb
 * instead of one solid white pill.
 */
import { chromium } from 'playwright-core'

const [url, outDir, prefix = 'h'] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge', headless: true })

const measure = () => {
  const parse = (value) => value.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
  }
  const read = (selector, pseudo) => {
    const node = document.querySelector(selector)
    if (node === null) return null
    const style = getComputedStyle(node, pseudo ?? null)
    return { background: style.backgroundColor, color: style.color, border: style.borderColor }
  }
  const body = getComputedStyle(document.body)
  const strong = read('.dshap-btn-strong')
  const secondary = read('.dshap-btn:not(.dshap-btn-strong)')
  const on = read('.dshap-toggle[aria-checked="true"]')
  const onThumb = read('.dshap-toggle[aria-checked="true"]', '::after')
  const off = read('.dshap-toggle[aria-checked="false"]')
  const offThumb = read('.dshap-toggle[aria-checked="false"]', '::after')
  return {
    tokens: {
      brand: body.getPropertyValue('--dsw-alias-brand-primary').trim(),
      primaryFill: body.getPropertyValue('--dsw-alias-button-primary-fill').trim(),
      foreground: body.getPropertyValue('--dsw-alias-label-primary-foreground').trim(),
    },
    strong: strong === null ? null : { ...strong, contrast: contrast(parse(strong.color), parse(strong.background)) },
    secondary: secondary === null ? null : { ...secondary, contrast: contrast(parse(secondary.color), parse(secondary.background)) },
    toggleOn: on === null || onThumb === null ? null : {
      track: on.background,
      thumb: onThumb.background,
      contrast: contrast(parse(onThumb.background), parse(on.background)),
    },
    toggleOff: off === null || offThumb === null ? null : {
      track: off.background,
      thumb: offThumb.background,
      contrast: contrast(parse(offThumb.background), parse(off.background)),
    },
  }
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 200)))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 200)) })

  await page.goto(url, { waitUntil: 'commit', timeout: 60000 })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 })
  // A cold server can take a few seconds to mount the shell.
  const settingsButton = page.locator('button[aria-label*="设置"]').first()
  await settingsButton.waitFor({ timeout: 40000 })
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(700)
  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) {
    await notice.first().click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
  }

  await settingsButton.click({ timeout: 8000 })
  await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '外观' }).first().click({ timeout: 8000 })
  await page.waitForTimeout(900)

  console.log('controls (switches on):', JSON.stringify(await page.evaluate(measure), null, 2))

  const strongShot = page.locator('.dshap-btn-strong').first()
  await strongShot.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await strongShot.screenshot({ path: `${outDir}/${prefix}1-button.png` })
  await page.locator('.dshap-toggle[aria-checked="true"]').first().screenshot({ path: `${outDir}/${prefix}2-toggle-on.png` })
  await page.screenshot({ path: `${outDir}/${prefix}4-settings.png` })

  // Flip the first switch off to inspect the off state, then restore it.
  const first = page.locator('.dshap-toggle').first()
  await first.click()
  await page.waitForTimeout(400)
  console.log('controls (first switch off):', JSON.stringify(await page.evaluate(measure), null, 2))
  await page.locator('.dshap-toggle[aria-checked="false"]').first().screenshot({ path: `${outDir}/${prefix}3-toggle-off.png` })
  await first.click()
  await page.waitForTimeout(300)
  await page.locator('.dshap-item').first().screenshot({ path: `${outDir}/${prefix}5-item.png` })

  console.log('console errors:', JSON.stringify(errors))
} finally {
  await browser.close()
}
