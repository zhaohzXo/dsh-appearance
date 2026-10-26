/**
 * Builds the shipping client module: splices the generated intro stylesheet
 * into the client template. No bundler, no dependencies.
 *
 * Run: node build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const css = readFileSync(new URL('./src/intro.css', import.meta.url), 'utf8')
const template = readFileSync(new URL('./src/client.template.js', import.meta.url), 'utf8')

if (!template.includes('__INTRO_CSS__')) {
  console.error('template is missing the __INTRO_CSS__ placeholder')
  process.exit(1)
}

const built = template.replace('__INTRO_CSS__', () => JSON.stringify(css))
writeFileSync(new URL('./client.js', import.meta.url), built)
console.log(`wrote client.js (${String(built.length)} bytes, css ${String(css.length)} bytes)`)
