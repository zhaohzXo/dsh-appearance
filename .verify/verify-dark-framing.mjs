/**
 * Dark-theme pass for the wallpaper: framing (zoom + drag), URL source, and the
 * token-drawn dropdowns. The theme is switched through the shipped Settings UI,
 * so the assertions run against the real dark palette.
 */
import { chromium } from 'playwright-core'

const [url, image, outDir] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const log = (...parts) => console.log(...parts)

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">'
  + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
  + '<stop offset="0" stop-color="#0ea5e9"/><stop offset="1" stop-color="#a855f7"/>'
  + '</linearGradient></defs><rect width="800" height="400" fill="url(#g)"/>'
  + '<circle cx="640" cy="110" r="70" fill="#fbbf24"/></svg>'
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

async function facts(page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body)
    const html = getComputedStyle(document.documentElement)
    return {
      themePreference: document.documentElement.dataset.theme ?? null,
      htmlBackground: html.backgroundColor,
      bodyImage: body.backgroundImage.slice(0, 60),
      bodySize: body.backgroundSize,
      bodyPosition: body.backgroundPosition,
      bodyAttachment: body.backgroundAttachment,
      baseToken: body.getPropertyValue('--dsw-alias-bg-base').trim(),
      sidebarToken: body.getPropertyValue('--dsw-specific-sidebar-fill').trim(),
      config: window.localStorage.getItem('dsh.appearance.v1'),
    }
  })
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', (error) => log('pageerror:', error.message.slice(0, 240)))
  page.on('console', (message) => { if (message.type() === 'error') log('console.error:', message.text().slice(0, 240)) })

  await page.goto(url, { waitUntil: 'commit', timeout: 60000 })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(800)
  const notice = page.getByRole('button', { name: '继续' })
  if ((await notice.count()) > 0) {
    await notice.first().click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(900)
    log('preview notice dismissed')
  }

  // The temporary profile pins `ui-theme.preference: dark`, so the shell must
  // already be in the dark palette here.
  await page.locator('button[aria-label*="设置"]').first().click({ timeout: 8000 })
  await page.waitForTimeout(1200)
  log('theme snapshot:', JSON.stringify(await page.evaluate(() => ({
    htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    baseToken: getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim(),
    sidebarToken: getComputedStyle(document.body).getPropertyValue('--dsw-specific-sidebar-fill').trim(),
  }))))

  // Open our page and upload a wallpaper.
  await page.getByRole('button', { name: '外观' }).first().click({ timeout: 8000 })
  await page.waitForTimeout(900)
  await page.locator('.dshap-item input[type=file]').first().setInputFiles(image)
  await page.waitForTimeout(3000)
  log('after upload:', JSON.stringify(await facts(page), null, 2))
  await page.screenshot({ path: `${outDir}/d1-dark-wallpaper.png` })

  // Dropdowns must be token-drawn, not white OS popups.
  const presetButton = page.locator('.dshap-ddBtn').first()
  await presetButton.click({ timeout: 5000 })
  await page.waitForTimeout(500)
  const menu = await page.evaluate(() => {
    const node = document.querySelector('.dshap-ddMenu')
    if (node === null) return null
    const style = getComputedStyle(node)
    const option = node.querySelector('.dshap-ddOption')
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      shadow: style.boxShadow.slice(0, 40),
      options: node.querySelectorAll('.dshap-ddOption').length,
      optionBackground: option === null ? null : getComputedStyle(option).backgroundColor,
      text: node.innerText.replace(/\s+/g, ' ').slice(0, 120),
    }
  })
  log('dropdown menu:', JSON.stringify(menu))
  await page.screenshot({ path: `${outDir}/d2-dark-dropdown.png` })

  // Pick aurora from the menu, then violet from the accent menu.
  await page.locator('.dshap-ddMenu .dshap-ddOption').filter({ hasText: '极光流带' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('.dshap-ddBtn').nth(1).click()
  await page.waitForTimeout(400)
  await page.locator('.dshap-ddMenu .dshap-ddOption').filter({ hasText: '紫罗兰' }).first().click()
  await page.waitForTimeout(600)
  log('after menu picks:', JSON.stringify(await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('dsh.appearance.v1')).intro)))

  // Zoom slider.
  const zoomSlider = page.locator('.dshap-slider input').first()
  await zoomSlider.fill('180')
  await page.waitForTimeout(600)
  const zoomed = await facts(page)
  log('after zoom 180:', JSON.stringify({ size: zoomed.bodySize, position: zoomed.bodyPosition, config: zoomed.config }))

  // Drag the stage to reframe (scroll it into view first: the panel scrolls).
  const stage = page.locator('.dshap-stage').first()
  await stage.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  const box = await stage.boundingBox()
  log('stage box:', JSON.stringify(box))
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 40, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(600)
  const dragged = await facts(page)
  log('after drag:', JSON.stringify({ position: dragged.bodyPosition, config: dragged.config }))
  await page.screenshot({ path: `${outDir}/d3-dark-framing.png` })

  // URL source: an inline SVG must load, measure, and be stored as a URL.
  await page.locator('.dshap-urlInput').fill(dataUrl)
  await page.getByRole('button', { name: '载入' }).click({ timeout: 5000 })
  await page.waitForTimeout(1600)
  const urlState = await facts(page)
  log('after url load:', JSON.stringify({ image: urlState.bodyImage, size: urlState.bodySize, config: urlState.config }, null, 2))
  await page.screenshot({ path: `${outDir}/d4-dark-url-source.png` })

  // Close settings: the live frame should show the wallpaper.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${outDir}/d5-dark-main.png` })
  const shell = await page.evaluate(() => {
    const pick = (needle) => [...document.querySelectorAll('div')].find((el) =>
      typeof el.className === 'string' && el.className.includes(needle)) ?? null
    const describe = (element) => element === null ? null : getComputedStyle(element).backgroundColor
    return { frame: describe(pick('frame')), sidebar: describe(pick('sidebarCol')) }
  })
  log('shell fills (dark):', JSON.stringify(shell))

  // Persistence: the framing must come back on reload.
  await page.reload({ waitUntil: 'commit' })
  await page.waitForTimeout(1200)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(800)
  log('after reload:', JSON.stringify(await facts(page), null, 2))
} finally {
  await browser.close()
}
