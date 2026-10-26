/**
 * Appearance plugin for DeepSeek Harness: a single Settings page that owns the
 * window wallpaper and the boot intro.
 *
 * Both halves are presentation-only. The wallpaper paints `document.body` and
 * drives two shell colour tokens through the public theme service, so the frame
 * and the sidebar turn translucent while cards and menus stay opaque. The boot
 * intro is a self-contained cover — its own DOM, its own canvas field, its own
 * timers — modelled on the upstream `BootIntro` in `@deepseek-ai/dsh-client-web`,
 * made configurable and shipped where that build has no intro.
 *
 * Preferences live in `localStorage`: they are local decoration, not Host state.
 *
 * @module @workfile/dsh-appearance
 */

window.__ModuleLoader__.load({
  id: '@workfile/dsh-appearance',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Boot-intro stylesheet, generated from the upstream CSS module. */
    const INTRO_CSS = "\n/* Accent palettes. The cover resolves every tint through these properties, so\n * one attribute on the cover repaints the chrome and the canvas field. */\n.dshfx-root {\n  --fx-1: 94 234 212;\n  --fx-2: 56 189 248;\n  --fx-3: 139 92 246;\n  --fx-4: 125 211 252;\n  --fx-5: 148 197 255;\n  --fx-6: 203 213 225;\n  --fx-7: 148 163 184;\n  --fx-8: 167 139 250;\n  --fx-9: 186 230 253;\n  --fx-s1: #5eead4;\n  --fx-s1b: #8be9d9;\n  --fx-s2: #22d3ee;\n  --fx-s3: #a78bfa;\n  --fx-s3b: #c4b5fd;\n  --fx-text: #f4f9ff;\n}\n\n.dshfx-root[data-accent='violet'] {\n  --fx-1: 167 139 250;\n  --fx-2: 139 92 246;\n  --fx-3: 56 189 248;\n  --fx-4: 196 181 253;\n  --fx-5: 221 214 254;\n  --fx-6: 226 232 240;\n  --fx-7: 148 163 184;\n  --fx-8: 125 211 252;\n  --fx-9: 233 213 255;\n  --fx-s1: #a78bfa;\n  --fx-s1b: #c4b5fd;\n  --fx-s2: #8b5cf6;\n  --fx-s3: #38bdf8;\n  --fx-s3b: #7dd3fc;\n  --fx-text: #f5f3ff;\n}\n\n.dshfx-root[data-accent='amber'] {\n  --fx-1: 251 191 36;\n  --fx-2: 245 158 11;\n  --fx-3: 239 68 68;\n  --fx-4: 253 224 71;\n  --fx-5: 254 240 138;\n  --fx-6: 254 243 199;\n  --fx-7: 180 83 9;\n  --fx-8: 251 146 60;\n  --fx-9: 255 237 213;\n  --fx-s1: #fbbf24;\n  --fx-s1b: #fde68a;\n  --fx-s2: #f59e0b;\n  --fx-s3: #ef4444;\n  --fx-s3b: #fca5a5;\n  --fx-text: #fffbeb;\n}\n\n.dshfx-root[data-accent='emerald'] {\n  --fx-1: 52 211 153;\n  --fx-2: 16 185 129;\n  --fx-3: 34 211 238;\n  --fx-4: 110 231 183;\n  --fx-5: 167 243 208;\n  --fx-6: 209 250 229;\n  --fx-7: 6 148 162;\n  --fx-8: 45 212 191;\n  --fx-9: 204 251 241;\n  --fx-s1: #34d399;\n  --fx-s1b: #6ee7b7;\n  --fx-s2: #10b981;\n  --fx-s3: #22d3ee;\n  --fx-s3b: #67e8f9;\n  --fx-text: #ecfdf5;\n}\n\n/* Single-scene presets have no shot rail to report progress against. */\n.dshfx-root[data-compact] .dshfx-steps,\n.dshfx-root[data-compact] .dshfx-hint {\n  display: none;\n}\n\n/* The skip affordances disappear when the user disables skipping. */\n.dshfx-root[data-noskip] .dshfx-skip,\n.dshfx-root[data-noskip] .dshfx-hint {\n  display: none;\n}\n\n/* Completion flash: one bloom as the meter tops out. */\n.dshfx-root[data-flash] .dshfx-flash {\n  opacity: 1;\n  transition-duration: 90ms;\n}\n\n.dshfx-root[data-preview] {\n  cursor: default;\n}\n\n/* Cinematic boot cover. Every surface is self-contained: the cover must render\n * before theme tokens or fonts are guaranteed, so it only uses literal colors\n * and system stacks. The sequence runs four scenes (`data-scene`), each\n * choreographed here while the canvas paints the matching particle field. */\n\n.dshfx-root {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483500;\n  display: grid;\n  place-items: center;\n  overflow: hidden;\n  background:\n    radial-gradient(120% 90% at 50% -10%, rgb(var(--fx-2) / 0.18), transparent 55%),\n    radial-gradient(90% 70% at 82% 108%, rgb(var(--fx-3) / 0.24), transparent 60%),\n    radial-gradient(70% 60% at 12% 88%, rgb(20 184 166 / 0.16), transparent 62%),\n    #04060c;\n  color: #e8f2ff;\n  opacity: 1;\n  transition: opacity 700ms cubic-bezier(0.65, 0, 0.35, 1),\n    transform 700ms cubic-bezier(0.65, 0, 0.35, 1),\n    filter 700ms cubic-bezier(0.65, 0, 0.35, 1);\n}\n\n.dshfx-root[data-exiting] {\n  opacity: 0;\n  transform: scale(1.06);\n  filter: blur(8px) brightness(1.2);\n  pointer-events: none;\n}\n\n.dshfx-root[data-reduced] {\n  transition-duration: 1ms;\n}\n\n.dshfx-field {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  opacity: 0.82;\n}\n\n/* Perspective grid floor + horizon glow. */\n.dshfx-grid {\n  position: absolute;\n  inset: 0;\n  background-image:\n    linear-gradient(rgb(var(--fx-1) / 0.075) 1px, transparent 1px),\n    linear-gradient(90deg, rgb(var(--fx-1) / 0.075) 1px, transparent 1px);\n  background-size: 64px 64px;\n  mask-image: radial-gradient(75% 62% at 50% 58%, #000 10%, transparent 78%);\n  transform: perspective(520px) rotateX(58deg) scale(2.1) translateY(18%);\n  transform-origin: 50% 100%;\n  opacity: 0.55;\n  transition: opacity 1.2s ease, animation-duration 1.2s ease;\n  animation: gridDrift 14s linear infinite;\n}\n\n/* Breathing energy halo behind the wordmark, with one rotating arc. */\n.dshfx-halo {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: min(92vmin, 880px);\n  aspect-ratio: 1;\n  border-radius: 50%;\n  corner-shape: round;\n  transform: translate(-50%, -50%) scale(0.92);\n  background: radial-gradient(circle, rgb(var(--fx-2) / 0.16), rgb(var(--fx-3) / 0.06) 46%, transparent 68%);\n  filter: blur(26px);\n  opacity: 0.55;\n  pointer-events: none;\n  transition: transform 1.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease;\n  animation: haloPulse 6s ease-in-out infinite;\n}\n\n.dshfx-halo::before {\n  content: '';\n  position: absolute;\n  inset: 12%;\n  border-radius: 50%;\n  corner-shape: round;\n  background: conic-gradient(\n    from 0deg,\n    transparent 0deg 210deg,\n    rgb(var(--fx-1) / 0.5) 286deg,\n    rgb(var(--fx-4) / 0.16) 320deg,\n    transparent 352deg\n  );\n  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));\n  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));\n  animation: spin 7.5s linear infinite;\n}\n\n.dshfx-rings {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  pointer-events: none;\n  transition: transform 1.3s cubic-bezier(0.16, 1, 0.3, 1), filter 1.3s ease;\n}\n\n.dshfx-ring {\n  position: absolute;\n  width: min(46vmin, 430px);\n  aspect-ratio: 1;\n  border-radius: 50%;\n  corner-shape: round;\n  border: 1px solid rgb(var(--fx-1) / 0.28);\n  box-shadow:\n    0 0 34px rgb(var(--fx-1) / 0.16) inset,\n    0 0 24px rgb(var(--fx-2) / 0.12);\n  transition: border-color 1.2s ease, box-shadow 1.2s ease;\n  animation: breathe 5.5s ease-in-out infinite;\n}\n\n.dshfx-ring::before,\n.dshfx-ring::after {\n  content: '';\n  position: absolute;\n  border-radius: 50%;\n  corner-shape: round;\n  border: 1px solid transparent;\n}\n\n.dshfx-ring::before {\n  inset: -18px;\n  border-top-color: rgb(var(--fx-4) / 0.55);\n  border-right-color: rgb(var(--fx-4) / 0.14);\n  animation: spin 9s linear infinite;\n}\n\n.dshfx-ring::after {\n  inset: 18px;\n  border-bottom-color: rgb(var(--fx-8) / 0.5);\n  border-left-color: rgb(var(--fx-8) / 0.12);\n  animation: spin 13s linear infinite reverse;\n}\n\n.dshfx-ringSlow {\n  width: min(62vmin, 590px);\n  border-color: rgb(var(--fx-3) / 0.16);\n  animation-duration: 8s;\n}\n\n.dshfx-ringDash {\n  width: min(34vmin, 320px);\n  border-style: dashed;\n  border-color: rgb(226 232 240 / 0.14);\n  animation-duration: 11s;\n}\n\n/* Scene 1: the rings rush outward out of focus. */\n.dshfx-root[data-scene='warp'] .dshfx-rings {\n  transform: scale(1.2);\n  filter: blur(1.5px);\n}\n\n.dshfx-root[data-scene='warp'] .dshfx-grid {\n  opacity: 0.9;\n  animation-duration: 4.5s;\n}\n\n.dshfx-root[data-scene='warp'] .dshfx-halo {\n  transform: translate(-50%, -50%) scale(0.68);\n  opacity: 0.95;\n}\n\n/* Scene 2: the mesh settles over the full frame; rings dim down. */\n.dshfx-root[data-scene='mesh'] .dshfx-ring {\n  border-color: rgb(var(--fx-1) / 0.18);\n}\n\n.dshfx-root[data-scene='mesh'] .dshfx-halo {\n  opacity: 0.4;\n}\n\n/* Scene 3: the orbital array widens and tilts. */\n.dshfx-root[data-scene='orbit'] .dshfx-rings {\n  transform: scale(1.1) rotate(9deg);\n}\n\n.dshfx-root[data-scene='orbit'] .dshfx-halo {\n  transform: translate(-50%, -50%) scale(1.16);\n  opacity: 0.8;\n}\n\n.dshfx-root[data-scene='orbit'] .dshfx-ring {\n  border-color: rgb(var(--fx-8) / 0.38);\n}\n\n/* Scene 4: the core closes in and the scan accelerates. */\n.dshfx-root[data-scene='core'] .dshfx-rings {\n  transform: scale(0.84);\n  filter: none;\n}\n\n.dshfx-root[data-scene='core'] .dshfx-ring {\n  border-color: rgb(var(--fx-1) / 0.55);\n  box-shadow:\n    0 0 52px rgb(var(--fx-1) / 0.24) inset,\n    0 0 40px rgb(var(--fx-2) / 0.24);\n}\n\n.dshfx-root[data-scene='core'] .dshfx-halo {\n  transform: translate(-50%, -50%) scale(1.28);\n  opacity: 1;\n}\n\n.dshfx-root[data-scene='core'] .dshfx-scan {\n  animation-duration: 1.9s;\n}\n\n/* A single radar sweep crossing the cover. */\n.dshfx-scan {\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(\n    to bottom,\n    transparent 0%,\n    rgb(var(--fx-1) / 0.035) 46%,\n    rgb(var(--fx-1) / 0.16) 50%,\n    rgb(var(--fx-1) / 0.035) 54%,\n    transparent 100%\n  );\n  transform: translateY(-100%);\n  animation: sweep 4.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;\n  pointer-events: none;\n  transition: animation-duration 800ms ease;\n}\n\n/* Scene-change flash: a short additive bloom between shots. */\n.dshfx-flash {\n  position: absolute;\n  inset: 0;\n  z-index: 3;\n  pointer-events: none;\n  opacity: 0;\n  transition: opacity 180ms ease-out;\n  background: radial-gradient(\n    circle at 50% 50%,\n    rgb(255 255 255 / 0.5),\n    rgb(var(--fx-1) / 0.18) 38%,\n    transparent 68%\n  );\n  mix-blend-mode: screen;\n}\n\n.dshfx-root[data-shift] .dshfx-flash {\n  opacity: 1;\n  transition-duration: 60ms;\n}\n\n.dshfx-root[data-ready] .dshfx-flash {\n  opacity: 0.85;\n  transition-duration: 120ms;\n}\n\n.dshfx-root[data-exiting] .dshfx-flash {\n  opacity: 0;\n}\n\n/* Side telemetry rails: tick marks plus a fading seam. */\n.dshfx-hud {\n  position: absolute;\n  top: 15%;\n  bottom: 15%;\n  z-index: 1;\n  width: 12px;\n  opacity: 0.55;\n  pointer-events: none;\n  background: repeating-linear-gradient(\n    to bottom,\n    rgb(var(--fx-1) / 0.6) 0 1px,\n    transparent 1px 15px\n  );\n  -webkit-mask: linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent);\n  mask: linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent);\n}\n\n.dshfx-hud::after {\n  content: '';\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  width: 1px;\n  background: linear-gradient(\n    to bottom,\n    transparent,\n    rgb(var(--fx-1) / 0.7) 22%,\n    rgb(var(--fx-8) / 0.5) 78%,\n    transparent\n  );\n}\n\n.dshfx-hudLeft {\n  left: 28px;\n}\n\n.dshfx-hudLeft::after {\n  left: -6px;\n}\n\n.dshfx-hudRight {\n  right: 28px;\n}\n\n.dshfx-hudRight::after {\n  right: -6px;\n}\n\n.dshfx-center {\n  position: relative;\n  z-index: 2;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 13px;\n  padding: 32px;\n  text-align: center;\n  animation: rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both;\n}\n\n.dshfx-eyebrow {\n  font: 500 10px/1.4 'SF Mono', 'JetBrains Mono', Consolas, monospace;\n  letter-spacing: 0.42em;\n  color: rgb(var(--fx-5) / 0.72);\n  text-transform: uppercase;\n}\n\n.dshfx-wordmark {\n  font: 200 clamp(30px, 5.2vw, 58px)/1.08 'Montserrat', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;\n  letter-spacing: 0.24em;\n  padding-left: 0.24em; /* balances the trailing letter-spacing */\n  color: var(--fx-text);\n  text-shadow:\n    0 0 18px rgb(var(--fx-1) / 0.5),\n    0 0 52px rgb(var(--fx-2) / 0.32);\n  background: linear-gradient(100deg, #ffffff 0%, #b9ecff 38%, var(--fx-s1b) 58%, var(--fx-s3b) 85%, #ffffff 100%);\n  background-size: 220% 100%;\n  -webkit-background-clip: text;\n  background-clip: text;\n  -webkit-text-fill-color: transparent;\n  animation: shimmer 5.2s linear infinite;\n}\n\n.dshfx-tagline {\n  margin-top: -4px;\n  font: 500 11px/1.6 'SF Mono', 'JetBrains Mono', Consolas, monospace;\n  letter-spacing: 0.3em;\n  color: rgb(var(--fx-6) / 0.6);\n}\n\n.dshfx-track {\n  position: relative;\n  width: min(56vw, 360px);\n  height: 2px;\n  margin-top: 16px;\n  overflow: hidden;\n  background: rgb(var(--fx-7) / 0.18);\n  box-shadow: 0 0 18px rgb(var(--fx-2) / 0.16);\n}\n\n.dshfx-fill {\n  position: absolute;\n  inset: 0;\n  transform: scaleX(0);\n  transform-origin: 0 50%;\n  background: linear-gradient(90deg, var(--fx-s2), var(--fx-s1) 55%, var(--fx-s3));\n  box-shadow: 0 0 14px rgb(var(--fx-1) / 0.9);\n  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.dshfx-fill::after {\n  content: '';\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.75), transparent);\n  transform: translateX(-100%);\n  animation: glint 2.4s ease-in-out infinite;\n}\n\n.dshfx-meta {\n  display: flex;\n  width: min(56vw, 360px);\n  justify-content: space-between;\n  gap: 16px;\n  font: 500 10px/1.6 'SF Mono', 'JetBrains Mono', Consolas, monospace;\n  letter-spacing: 0.18em;\n  color: rgb(var(--fx-5) / 0.66);\n}\n\n.dshfx-counter {\n  font-variant-numeric: tabular-nums;\n  color: rgb(var(--fx-1) / 0.9);\n}\n\n.dshfx-status {\n  text-transform: uppercase;\n}\n\n/* Four-step sequence rail. */\n.dshfx-steps {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 10px 20px;\n  margin-top: 18px;\n}\n\n.dshfx-step {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  font: 500 9px/1.4 'SF Mono', 'JetBrains Mono', Consolas, monospace;\n  letter-spacing: 0.16em;\n  color: rgb(var(--fx-7) / 0.32);\n  transition: color 320ms ease;\n}\n\n.dshfx-stepDot {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  corner-shape: round;\n  background: currentColor;\n  box-shadow: 0 0 0 transparent;\n  transition: box-shadow 320ms ease, background 320ms ease;\n}\n\n.dshfx-stepDone {\n  color: rgb(var(--fx-1) / 0.42);\n}\n\n.dshfx-stepActive {\n  color: rgb(var(--fx-1) / 0.95);\n}\n\n.dshfx-stepActive .dshfx-stepDot {\n  background: var(--fx-s1);\n  box-shadow: 0 0 12px rgb(var(--fx-1) / 0.9);\n  animation: stepPulse 1.6s ease-in-out infinite;\n}\n\n.dshfx-hint {\n  margin-top: 6px;\n  font: 400 10px/1.6 'Segoe UI', 'Microsoft YaHei', sans-serif;\n  letter-spacing: 0.12em;\n  color: rgb(var(--fx-7) / 0.4);\n}\n\n/* Current shot, anchored above the bottom-left corner bracket. */\n.dshfx-sceneTag {\n  position: absolute;\n  bottom: 34px;\n  left: 70px;\n  z-index: 2;\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  font: 500 9px/1.4 'SF Mono', 'JetBrains Mono', Consolas, monospace;\n  letter-spacing: 0.24em;\n  color: rgb(var(--fx-5) / 0.55);\n  text-transform: uppercase;\n  pointer-events: none;\n}\n\n.dshfx-sceneTag::before {\n  content: '';\n  width: 24px;\n  height: 1px;\n  background: linear-gradient(to right, transparent, rgb(var(--fx-1) / 0.8));\n}\n\n/* Explicit skip control. The whole cover also skips on click or ESC. */\n.dshfx-skip {\n  position: absolute;\n  top: 70px;\n  right: 28px;\n  z-index: 4;\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  padding: 9px 14px;\n  box-sizing: border-box;\n  border: 1px solid rgb(var(--fx-1) / 0.26);\n  border-radius: 2px;\n  background: rgb(8 16 28 / 0.55);\n  color: rgb(var(--fx-6) / 0.82);\n  font: 500 10px/1 'SF Mono', 'JetBrains Mono', Consolas, monospace;\n  letter-spacing: 0.2em;\n  cursor: pointer;\n  backdrop-filter: blur(8px);\n  transition: color 200ms ease, border-color 200ms ease, background 200ms ease, box-shadow 200ms ease;\n}\n\n.dshfx-skip:hover {\n  border-color: rgb(var(--fx-1) / 0.8);\n  background: rgb(16 30 46 / 0.82);\n  color: var(--fx-text);\n  box-shadow: 0 0 26px rgb(var(--fx-1) / 0.26);\n}\n\n.dshfx-skip:focus-visible {\n  outline: 2px solid rgb(var(--fx-1) / 0.9);\n  outline-offset: 3px;\n}\n\n.dshfx-skipZh {\n  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;\n  letter-spacing: 0.28em;\n  color: rgb(var(--fx-5) / 0.72);\n}\n\n.dshfx-skipKey {\n  padding: 2px 5px;\n  border: 1px solid rgb(var(--fx-5) / 0.28);\n  border-radius: 3px;\n  color: rgb(var(--fx-5) / 0.68);\n  font-size: 9px;\n  letter-spacing: 0.08em;\n}\n\n.dshfx-corner {\n  position: absolute;\n  width: 26px;\n  height: 26px;\n  border: 1px solid rgb(var(--fx-1) / 0.35);\n  opacity: 0.6;\n}\n\n.dshfx-cornerTopLeft {\n  top: 26px;\n  left: 26px;\n  border-right: 0;\n  border-bottom: 0;\n}\n\n.dshfx-cornerTopRight {\n  top: 26px;\n  right: 26px;\n  border-left: 0;\n  border-bottom: 0;\n}\n\n.dshfx-cornerBottomLeft {\n  bottom: 26px;\n  left: 26px;\n  border-right: 0;\n  border-top: 0;\n}\n\n.dshfx-cornerBottomRight {\n  bottom: 26px;\n  right: 26px;\n  border-left: 0;\n  border-top: 0;\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n@keyframes breathe {\n  0%, 100% { transform: scale(1); opacity: 0.85; }\n  50% { transform: scale(1.045); opacity: 0.5; }\n}\n\n@keyframes gridDrift {\n  to { background-position: 0 64px, 64px 0; }\n}\n\n@keyframes sweep {\n  0% { transform: translateY(-100%); opacity: 0; }\n  12% { opacity: 1; }\n  88% { opacity: 1; }\n  100% { transform: translateY(100%); opacity: 0; }\n}\n\n@keyframes rise {\n  from { opacity: 0; transform: translateY(14px); }\n  to { opacity: 1; transform: none; }\n}\n\n@keyframes shimmer {\n  to { background-position: -220% 0; }\n}\n\n@keyframes glint {\n  60%, 100% { transform: translateX(100%); }\n}\n\n@keyframes haloPulse {\n  0%, 100% { filter: blur(26px) brightness(1); }\n  50% { filter: blur(30px) brightness(1.22); }\n}\n\n@keyframes stepPulse {\n  0%, 100% { transform: scale(1); opacity: 0.9; }\n  50% { transform: scale(1.5); opacity: 1; }\n}\n\n@media (max-width: 760px) {\n  .dshfx-hud {\n    display: none;\n  }\n\n  .dshfx-sceneTag {\n    left: 48px;\n    bottom: 30px;\n  }\n\n  .dshfx-skip {\n    top: 62px;\n    right: 20px;\n  }\n}\n\n@media (max-width: 560px) {\n  .dshfx-stepLabel {\n    display: none;\n  }\n\n  .dshfx-steps {\n    gap: 12px;\n  }\n\n  .dshfx-skipZh {\n    display: none;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .dshfx-root,\n  .dshfx-center {\n    animation: none;\n    transition-duration: 1ms;\n  }\n\n  .dshfx-field,\n  .dshfx-grid,\n  .dshfx-halo,\n  .dshfx-rings,\n  .dshfx-scan,\n  .dshfx-flash,\n  .dshfx-hud,\n  .dshfx-fill::after {\n    display: none;\n  }\n\n  .dshfx-stepActive .dshfx-stepDot {\n    animation: none;\n  }\n}\n"

    const STORAGE_KEY = 'dsh.appearance.v1'
    const IMAGE_KEY = 'dsh.appearance.image.v1'
    const LEGACY_KEY = 'dsh.background.v1'
    const OVERRIDE_SOURCE = '@workfile/dsh-appearance'
    const MAX_SOURCE_BYTES = 30 * 1024 * 1024
    const MAX_STORED_LENGTH = 2_400_000
    const ATTEMPTS = [[2560, 0.86], [1920, 0.8], [1600, 0.72], [1280, 0.64]]
    const COVER_MIN = 30
    const COVER_MAX = 92
    const ZOOM_MIN = 1
    const ZOOM_MAX = 2.5
    const DURATION_MIN = 1.5
    const DURATION_MAX = 8

    // ----------------------------------------------------------- built-in walls

    const WALLPAPER_WIDTH = 2400
    const WALLPAPER_HEIGHT = 1350
    const THUMB_WIDTH = 320
    const THUMB_HEIGHT = 180

    /** Deterministic PRNG so a preset renders identically on every apply. */
    function seeded(seed) {
      let state = seed >>> 0
      return () => {
        state = (state + 0x6d2b79f5) >>> 0
        let value = state
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
      }
    }

    function paintSky(context, width, height, stops) {
      const gradient = context.createLinearGradient(0, 0, 0, height)
      for (const [offset, color] of stops) gradient.addColorStop(offset, color)
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
    }

    function paintStars(context, width, height, random, count, bottom, tint) {
      const unit = Math.min(width, height) / 1080
      for (let index = 0; index < count; index++) {
        const x = random() * width
        const y = random() * height * bottom
        const radius = Math.max(0.6, (random() < 0.05 ? 1.7 : 0.9) * unit)
        const alpha = 0.2 + random() * 0.7
        context.fillStyle = `rgba(${tint}, ${alpha.toFixed(3)})`
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
      }
    }

    /** One silhouette band; `floor` closes the shape above the canvas bottom. */
    function paintRidge(context, width, height, options) {
      const { base, amplitude, frequency, phase, color, octave, floor } = options
      const ground = floor ?? height
      context.beginPath()
      context.moveTo(0, ground)
      const stride = Math.max(2, Math.round(width / 420))
      for (let x = 0; x <= width; x += stride) {
        const t = x / width
        const y = height * base
          + Math.sin(t * 3.05 * frequency + phase) * amplitude
          + Math.sin(t * 8.1 * frequency + phase * 1.7) * amplitude * (octave ?? 0.4)
        context.lineTo(x, y)
      }
      context.lineTo(width, ground)
      context.closePath()
      context.fillStyle = color
      context.fill()
    }

    function paintSun(context, width, height, options) {
      const { x, y, radius, glow, core } = options
      const halo = context.createRadialGradient(x, y, radius * 0.15, x, y, radius * glow)
      halo.addColorStop(0, 'rgba(255, 228, 175, 0.85)')
      halo.addColorStop(0.35, 'rgba(255, 190, 120, 0.32)')
      halo.addColorStop(1, 'rgba(255, 170, 110, 0)')
      context.fillStyle = halo
      context.beginPath()
      context.arc(x, y, radius * glow, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = core
      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fill()
    }

    function drawDusk(context, width, height) {
      paintSky(context, width, height, [
        [0, '#080c1e'],
        [0.55, '#2c224c'],
        [0.8, '#966060'],
        [1, '#eeaa78'],
      ])
      paintStars(context, width, height, seeded(7), Math.round(420 * width / 1920), 0.5, '255, 250, 240')
      paintSun(context, width, height, {
        x: width / 2,
        y: height * 0.66,
        radius: height * 0.083,
        glow: 2.6,
        core: '#ffd696',
      })
      paintRidge(context, width, height, { base: 0.66, amplitude: height * 0.043, frequency: 0.9, phase: 0.2, color: '#46345c' })
      paintRidge(context, width, height, { base: 0.74, amplitude: height * 0.031, frequency: 1.4, phase: 1.1, color: '#2c2042' })
      paintRidge(context, width, height, { base: 0.84, amplitude: height * 0.022, frequency: 2.1, phase: 2.3, color: '#1a122a' })
      paintRidge(context, width, height, { base: 0.93, amplitude: height * 0.012, frequency: 3.1, phase: 0.6, color: '#0c0816' })
    }

    function drawDawn(context, width, height) {
      paintSky(context, width, height, [
        [0, '#0b1730'],
        [0.3, '#2b3f6b'],
        [0.58, '#8a5f7d'],
        [0.76, '#e08a68'],
        [0.86, '#ffc98f'],
        [1, '#ffd7a8'],
      ])
      const horizon = height * 0.62
      const sea = context.createLinearGradient(0, horizon, 0, height)
      sea.addColorStop(0, '#2a3554')
      sea.addColorStop(0.5, '#16203a')
      sea.addColorStop(1, '#0a1020')
      context.fillStyle = sea
      context.fillRect(0, horizon, width, height - horizon)
      paintSun(context, width, height, {
        x: width * 0.58,
        y: horizon - height * 0.055,
        radius: height * 0.055,
        glow: 3.2,
        core: '#ffe2ae',
      })
      // Sun path: widening, fading streaks on the water.
      const random = seeded(11)
      for (let index = 0; index < 46; index++) {
        const t = index / 46
        const y = horizon + Math.pow(t, 1.6) * (height - horizon) * 0.92
        const spread = width * (0.02 + t * 0.16)
        const alpha = 0.3 * (1 - t) ** 1.4 * (0.6 + random() * 0.6)
        context.fillStyle = `rgba(255, 205, 150, ${alpha.toFixed(3)})`
        context.fillRect(width * 0.58 - spread / 2, y, spread, Math.max(1.5, height * 0.004 * (1 + t * 2)))
      }
      context.fillStyle = 'rgba(255, 220, 180, 0.45)'
      context.fillRect(0, horizon - height * 0.002, width, height * 0.003)
      paintRidge(context, width, height, {
        base: 0.62,
        amplitude: height * 0.012,
        frequency: 1.7,
        phase: 4.2,
        color: '#1d2038',
        floor: horizon + height * 0.004,
      })
    }

    function drawAurora(context, width, height) {
      paintSky(context, width, height, [
        [0, '#050a18'],
        [0.5, '#0a1730'],
        [1, '#14284a'],
      ])
      paintStars(context, width, height, seeded(23), Math.round(700 * width / 1920), 0.75, '235, 245, 255')
      context.globalCompositeOperation = 'lighter'
      // Soft glow behind the curtains, so the sky is not flat black.
      const glow = context.createLinearGradient(0, height * 0.1, 0, height * 0.66)
      glow.addColorStop(0, 'rgba(40, 200, 160, 0)')
      glow.addColorStop(0.45, 'rgba(50, 220, 180, 0.16)')
      glow.addColorStop(1, 'rgba(60, 120, 220, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height * 0.7)
      const bands = [
        { y: 0.3, amp: 0.05, freq: 1.1, phase: 0.4, spread: 0.5, tint: '70, 255, 200' },
        { y: 0.36, amp: 0.06, freq: 1.6, phase: 2.1, spread: 0.34, tint: '120, 220, 255' },
        { y: 0.26, amp: 0.04, freq: 0.8, phase: 4.3, spread: 0.42, tint: '170, 130, 255' },
      ]
      for (const band of bands) {
        for (let layer = 0; layer < 16; layer++) {
          const offset = (layer / 16 - 0.5) * height * band.spread
          const alpha = 0.09 * (1 - Math.abs(layer / 16 - 0.5) * 1.4)
          context.strokeStyle = `rgba(${band.tint}, ${Math.max(0.012, alpha).toFixed(3)})`
          context.lineWidth = height * 0.026
          context.beginPath()
          for (let x = 0; x <= width; x += width / 96) {
            const t = x / width
            const y = height * band.y + Math.sin(t * Math.PI * band.freq + band.phase) * height * band.amp + offset
            if (x === 0) context.moveTo(x, y)
            else context.lineTo(x, y)
          }
          context.stroke()
        }
      }
      context.globalCompositeOperation = 'source-over'
      paintRidge(context, width, height, { base: 0.82, amplitude: height * 0.03, frequency: 1.2, phase: 1.9, color: '#070a14' })
      paintRidge(context, width, height, { base: 0.9, amplitude: height * 0.02, frequency: 2.4, phase: 0.3, color: '#03040a' })
    }

    function drawNebula(context, width, height) {
      paintSky(context, width, height, [
        [0, '#05060f'],
        [0.5, '#080a18'],
        [1, '#04040a'],
      ])
      paintStars(context, width, height, seeded(31), Math.round(1100 * width / 1920), 1, '240, 245, 255')
      context.globalCompositeOperation = 'lighter'
      const clouds = [
        { x: 0.32, y: 0.42, r: 0.46, color: '120, 70, 220', alpha: 0.46 },
        { x: 0.68, y: 0.55, r: 0.4, color: '40, 140, 220', alpha: 0.4 },
        { x: 0.5, y: 0.3, r: 0.3, color: '230, 90, 160', alpha: 0.32 },
        { x: 0.18, y: 0.72, r: 0.34, color: '60, 200, 210', alpha: 0.26 },
        { x: 0.82, y: 0.22, r: 0.22, color: '250, 170, 120', alpha: 0.2 },
      ]
      for (const cloud of clouds) {
        const halo = context.createRadialGradient(
          width * cloud.x, height * cloud.y, 0,
          width * cloud.x, height * cloud.y, Math.min(width, height) * cloud.r,
        )
        halo.addColorStop(0, `rgba(${cloud.color}, ${cloud.alpha})`)
        halo.addColorStop(1, `rgba(${cloud.color}, 0)`)
        context.fillStyle = halo
        context.fillRect(0, 0, width, height)
      }
      // A few bright foreground stars with a soft bloom.
      const bright = seeded(41)
      for (let index = 0; index < 14; index++) {
        const x = bright() * width
        const y = bright() * height
        const radius = height * (0.004 + bright() * 0.006)
        const bloom = context.createRadialGradient(x, y, 0, x, y, radius * 6)
        bloom.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
        bloom.addColorStop(1, 'rgba(200, 220, 255, 0)')
        context.fillStyle = bloom
        context.beginPath()
        context.arc(x, y, radius * 6, 0, Math.PI * 2)
        context.fill()
      }
      // Dust band through the middle, giving the field depth.
      const random = seeded(37)
      for (let index = 0; index < 240; index++) {
        const t = random()
        const x = t * width
        const y = height * (0.55 - t * 0.1) + (random() - 0.5) * height * 0.16
        context.fillStyle = `rgba(190, 205, 255, ${(0.03 + random() * 0.06).toFixed(3)})`
        context.beginPath()
        context.arc(x, y, 1.2 + random() * 2.4, 0, Math.PI * 2)
        context.fill()
      }
      context.globalCompositeOperation = 'source-over'
    }

    function drawDunes(context, width, height) {
      paintSky(context, width, height, [
        [0, '#1a1330'],
        [0.45, '#4a3358'],
        [0.72, '#b06a5a'],
        [1, '#f2b06a'],
      ])
      paintSun(context, width, height, {
        x: width * 0.68,
        y: height * 0.55,
        radius: height * 0.06,
        glow: 3,
        core: '#ffe3b0',
      })
      const layers = [
        { base: 0.62, amplitude: 0.05, frequency: 1.3, phase: 0.4, color: '#c08a68' },
        { base: 0.7, amplitude: 0.06, frequency: 1.9, phase: 2.4, color: '#96684f' },
        { base: 0.8, amplitude: 0.05, frequency: 1.1, phase: 4.1, color: '#5f3f37' },
        { base: 0.9, amplitude: 0.04, frequency: 2.6, phase: 1.2, color: '#33221f' },
      ]
      for (const layer of layers) {
        paintRidge(context, width, height, {
          base: layer.base,
          amplitude: height * layer.amplitude,
          frequency: layer.frequency,
          phase: layer.phase,
          color: layer.color,
          octave: 0.15,
        })
      }
    }

    function drawGradient(context, width, height) {
      const base = context.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#0ea5e9')
      base.addColorStop(0.55, '#6366f1')
      base.addColorStop(1, '#a855f7')
      context.fillStyle = base
      context.fillRect(0, 0, width, height)
      const halo = context.createRadialGradient(
        width * 0.78, height * 0.25, 0,
        width * 0.78, height * 0.25, height * 0.45,
      )
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.55)')
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)')
      context.fillStyle = halo
      context.fillRect(0, 0, width, height)
    }

    const WALLPAPERS = [
      { key: 'dusk', zh: '暮色山脉', en: 'Dusk ridges', draw: drawDusk },
      { key: 'dawn', zh: '黎明海岸', en: 'Dawn coast', draw: drawDawn },
      { key: 'aurora', zh: '极光夜空', en: 'Aurora night', draw: drawAurora },
      { key: 'nebula', zh: '深空星云', en: 'Deep nebula', draw: drawNebula },
      { key: 'dunes', zh: '黄昏沙丘', en: 'Dune dusk', draw: drawDunes },
      { key: 'gradient', zh: '极光渐变', en: 'Aurora gradient', draw: drawGradient },
    ]
    const WALLPAPER_KEYS = new Set(WALLPAPERS.map((entry) => entry.key))

    /** Draw a preset at a given size; null when the browser refuses a canvas. */
    function renderWallpaper(entry, width, height) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (context === null) return null
      entry.draw(context, width, height)
      return canvas
    }

    function wallpaperLabel(entry) {
      return language() === 'zh' ? entry.zh : entry.en
    }

    const PRESETS = {
      cinematic: {
        scenes: ['warp', 'mesh', 'orbit', 'core'],
        paint: 'scenes',
        compact: false,
        zh: '电影序列',
        en: 'Cinematic',
        zhHint: '四段镜头：跃迁隧道 → 神经网格 → 轨道阵列 → 运行时内核',
        enHint: 'Four shots: warp tunnel → neural mesh → orbital array → runtime core',
      },
      aurora: {
        scenes: ['orbit'],
        paint: 'aurora',
        compact: true,
        zh: '极光流带',
        en: 'Aurora',
        zhHint: '缓慢流动的光带，最安静的一种开场',
        enHint: 'Slow drifting light ribbons — the calmest opening',
      },
      starfield: {
        scenes: ['mesh'],
        paint: 'mesh',
        compact: true,
        zh: '星域网络',
        en: 'Starfield',
        zhHint: '漂浮星点与近邻连线，适合深色壁纸',
        enHint: 'Drifting stars linked by proximity, pairs well with a dark wallpaper',
      },
      minimal: {
        scenes: ['core'],
        paint: 'none',
        compact: true,
        zh: '极简光环',
        en: 'Minimal',
        zhHint: '只保留光环与文字，最省电、最快',
        enHint: 'Rings and type only — quietest and cheapest',
      },
    }

    const ACCENTS = {
      cyan: { zh: '青蓝', en: 'Cyan', swatch: '#5eead4', rgb: [94, 234, 212], rgb2: [56, 189, 248], rgb3: [139, 92, 246], rgb5: [148, 197, 255], rgb9: [186, 230, 253] },
      violet: { zh: '紫罗兰', en: 'Violet', swatch: '#a78bfa', rgb: [167, 139, 250], rgb2: [139, 92, 246], rgb3: [56, 189, 248], rgb5: [221, 214, 254], rgb9: [233, 213, 255] },
      amber: { zh: '琥珀', en: 'Amber', swatch: '#fbbf24', rgb: [251, 191, 36], rgb2: [245, 158, 11], rgb3: [239, 68, 68], rgb5: [254, 240, 138], rgb9: [255, 237, 213] },
      emerald: { zh: '翡翠', en: 'Emerald', swatch: '#34d399', rgb: [52, 211, 153], rgb2: [16, 185, 129], rgb3: [34, 211, 238], rgb5: [167, 243, 208], rgb9: [204, 251, 241] },
    }

    const SCENES = {
      warp: { id: 'warp', label: 'WARP TUNNEL', status: 'ESTABLISHING HYPERLINK' },
      mesh: { id: 'mesh', label: 'NEURAL MESH', status: 'SYNCHRONIZING PLUGIN FIBERS' },
      orbit: { id: 'orbit', label: 'ORBITAL ARRAY', status: 'ALIGNING RUNTIME NODES' },
      core: { id: 'core', label: 'RUNTIME CORE', status: 'SEALING LOCAL INTERFACE' },
    }

    const WORDMARK_DEFAULT = 'DEEPSEEK HARNESS'
    const GLYPHS = '01<>/\\[]{}=+*#%&$@'

    // ---------------------------------------------------------------- language

    const STRINGS = {
      zh: {
        'section.title': '外观',
        'group.background': '壁纸',
        'group.intro': '开场动画',
        'bg.title': '背景图片',
        'bg.desc': '本地图片会压缩后只存在这台浏览器；也可以直接填图片地址。',
        'bg.choose': '选择图片',
        'bg.change': '更换图片',
        'bg.remove': '移除',
        'bg.builtin': '内置壁纸',
        'bg.builtinHint': '点一下立即生效，随时可换。',
        'bg.veil': '遮罩强度',
        'bg.veilHint': '遮罩越高，壁纸越淡、文字越清晰。',
        'bg.framing': '取景',
        'bg.framingHint': '在预览里拖动调整位置，滚轮缩放；双击回到居中。',
        'bg.zoom': '缩放',
        'bg.reset': '重置取景',
        'bg.url': '图片地址',
        'bg.urlHint': '支持 https:// 或 data: 地址；直接引用，不占用本地存储。',
        'bg.load': '载入',
        'bg.urlInvalid': '请输入 http(s):// 或 data:image 开头的地址',
        'bg.loading': '载入中…',
        'intro.enable': '启用开场动画',
        'intro.enableDesc': '每次启动或刷新页面时播放，只影响本机显示。',
        'intro.preset': '动画样式',
        'intro.accent': '强调色',
        'intro.duration': '时长',
        'intro.durationHint': '单位秒。跳过按钮或 Esc 可随时结束。',
        'intro.wordmark': '标题文案',
        'intro.wordmarkHint': '留空则显示默认标题。',
        'intro.skip': '允许跳过',
        'intro.skipHint': '开启后点击任意处、按 Esc 或点右上角按钮都会立即结束。',
        'intro.preview': '预览动画',
        'intro.previewHint': '按当前设置立即播放一次。',
        'preview.on': '正在预览…',
      },
      en: {
        'section.title': 'Appearance',
        'group.background': 'Wallpaper',
        'group.intro': 'Boot intro',
        'bg.title': 'Background image',
        'bg.desc': 'Local images are compressed and kept in this browser; you can also paste an image URL.',
        'bg.choose': 'Choose image',
        'bg.change': 'Change image',
        'bg.remove': 'Remove',
        'bg.builtin': 'Built-in wallpapers',
        'bg.builtinHint': 'One click to apply; swap any time.',
        'bg.veil': 'Veil',
        'bg.veilHint': 'Higher veils fade the wallpaper and keep text legible.',
        'bg.framing': 'Framing',
        'bg.framingHint': 'Drag the preview to reframe, wheel to zoom, double-click to recentre.',
        'bg.zoom': 'Zoom',
        'bg.reset': 'Reset framing',
        'bg.url': 'Image URL',
        'bg.urlHint': 'Accepts https:// or data: URLs; linked, so it costs no local storage.',
        'bg.load': 'Load',
        'bg.urlInvalid': 'Enter an http(s):// or data:image URL',
        'bg.loading': 'Loading…',
        'intro.enable': 'Play the boot intro',
        'intro.enableDesc': 'Runs on every launch or reload; display only, local to this machine.',
        'intro.preset': 'Style',
        'intro.accent': 'Accent',
        'intro.duration': 'Duration',
        'intro.durationHint': 'Seconds. Skip or Esc ends it at any time.',
        'intro.wordmark': 'Wordmark',
        'intro.wordmarkHint': 'Empty falls back to the default title.',
        'intro.skip': 'Allow skipping',
        'intro.skipHint': 'Click anywhere, press Esc, or use the corner button to end it early.',
        'intro.preview': 'Preview',
        'intro.previewHint': 'Plays the intro once with the current settings.',
        'preview.on': 'Previewing…',
      },
    }

    function language() {
      const declared = document.documentElement.lang || navigator.language || 'zh'
      return declared.toLowerCase().startsWith('zh') ? 'zh' : 'en'
    }

    function t(key) {
      const table = STRINGS[language()] ?? STRINGS.zh
      return table[key] ?? STRINGS.zh[key] ?? key
    }

    function presetLabel(preset) {
      return language() === 'zh' ? preset.zh : preset.en
    }

    function presetHint(preset) {
      return language() === 'zh' ? preset.zhHint : preset.enHint
    }

    function accentLabel(accent) {
      return language() === 'zh' ? accent.zh : accent.en
    }

    // ------------------------------------------------------------------- state

    function defaults() {
      return {
        background: { image: '', preset: null, cover: 62, zoom: 1, position: { x: 50, y: 50 }, size: null },
        intro: {
          enabled: true,
          preset: 'cinematic',
          duration: 3.8,
          accent: 'cyan',
          wordmark: WORDMARK_DEFAULT,
          skip: true,
        },
      }
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function finite(value, fallback) {
      return Number.isFinite(value) ? value : fallback
    }

    function sanitize(raw) {
      const base = defaults()
      if (raw === null || typeof raw !== 'object') return base
      const background = raw.background !== null && typeof raw.background === 'object' ? raw.background : {}
      const intro = raw.intro !== null && typeof raw.intro === 'object' ? raw.intro : {}
      const position = background.position !== null && typeof background.position === 'object' ? background.position : {}
      const rawSize = background.size
      const size = rawSize !== null && typeof rawSize === 'object'
        && finite(rawSize.w, 0) > 0 && finite(rawSize.h, 0) > 0
        ? { w: Math.round(Number(rawSize.w)), h: Math.round(Number(rawSize.h)) }
        : null
      return {
        background: {
          image: typeof background.image === 'string' && background.image.length <= MAX_STORED_LENGTH ? background.image : '',
          preset: WALLPAPER_KEYS.has(background.preset) ? background.preset : null,
          cover: clamp(finite(background.cover, base.background.cover), COVER_MIN, COVER_MAX),
          zoom: clamp(finite(background.zoom, base.background.zoom), ZOOM_MIN, ZOOM_MAX),
          position: {
            x: clamp(finite(position.x, base.background.position.x), 0, 100),
            y: clamp(finite(position.y, base.background.position.y), 0, 100),
          },
          size,
        },
        intro: {
          enabled: intro.enabled !== false,
          preset: Object.hasOwn(PRESETS, intro.preset ?? '') ? intro.preset : base.intro.preset,
          duration: clamp(finite(intro.duration, base.intro.duration), DURATION_MIN, DURATION_MAX),
          accent: Object.hasOwn(ACCENTS, intro.accent ?? '') ? intro.accent : base.intro.accent,
          wordmark: typeof intro.wordmark === 'string' ? intro.wordmark.slice(0, 28) : base.intro.wordmark,
          skip: intro.skip !== false,
        },
      }
    }

    function readStorage() {
      try {
        // The wallpaper is megabytes and the preferences are bytes: they live
        // under separate keys so moving a slider never rewrites the image.
        const image = window.localStorage.getItem(IMAGE_KEY) ?? ''
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw !== null) {
          const parsed = JSON.parse(raw)
          const background = parsed !== null && typeof parsed === 'object'
            && parsed.background !== null && typeof parsed.background === 'object'
            ? parsed.background
            : {}
          return sanitize({ background: { ...background, image }, intro: parsed?.intro })
        }
        const legacy = window.localStorage.getItem(LEGACY_KEY)
        if (legacy !== null) {
          const migrated = sanitize({ background: JSON.parse(legacy) })
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            background: { cover: migrated.background.cover },
            intro: migrated.intro,
          }))
          if (migrated.background.image !== '') window.localStorage.setItem(IMAGE_KEY, migrated.background.image)
          return migrated
        }
      } catch {
        // Corrupt or unavailable storage: fall back to defaults.
      }
      return defaults()
    }

    let state = readStorage()
    const listeners = new Set()

    function commit(next) {
      const sanitized = sanitize(next)
      const imageChanged = sanitized.background.image !== state.background.image
      state = sanitized
      try {
        // The image travels under its own key; everything else is small enough
        // to rewrite on every change (including slider drags).
        const { image, ...geometry } = state.background
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          background: geometry,
          intro: state.intro,
        }))
        if (imageChanged) {
          if (state.background.image === '') window.localStorage.removeItem(IMAGE_KEY)
          else window.localStorage.setItem(IMAGE_KEY, state.background.image)
        }
      } catch {
        // Quota or privacy mode: keep the in-memory state and move on.
      }
      for (const listener of listeners) listener()
    }

    function patchBackground(patch) {
      commit({ ...state, background: { ...state.background, ...patch } })
    }

    function patchIntro(patch) {
      commit({ ...state, intro: { ...state.intro, ...patch } })
    }

    function subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }

    function getSnapshot() {
      return state
    }

    // -------------------------------------------------------------- wallpaper

    function translucency(token, percent) {
      return `color-mix(in srgb, var(--dsw-static-neutral-bluish-${token}) ${String(percent)}%, transparent)`
    }

    function wallpaperTokens(cover) {
      const percent = clamp(cover, COVER_MIN, COVER_MAX)
      return {
        '--dsw-alias-bg-base': { light: translucency('00', percent), dark: translucency('950', percent) },
        '--dsw-specific-sidebar-fill': {
          light: translucency('50', clamp(percent + 6, 0, 100)),
          dark: translucency('900', clamp(percent + 6, 0, 100)),
        },
      }
    }

    /**
     * Resolve `background-size` for one box.
     *
     * With the intrinsic image size known the wallpaper is laid out itself:
     * cover, multiplied by the zoom factor, expressed in pixels so a percentage
     * `background-position` maps predictably onto the overflow. Without the
     * size (a cross-origin URL that refused measurement) it degrades to a
     * width-relative size, which still zooms horizontally.
     */
    function backgroundGeometry(background, boxWidth, boxHeight) {
      const zoom = background.zoom ?? 1
      const size = background.size
      if (size !== null && size !== undefined && size.w > 0 && size.h > 0) {
        const scale = Math.max(boxWidth / size.w, boxHeight / size.h) * zoom
        const width = size.w * scale
        const height = size.h * scale
        return { css: `${String(Math.round(width))}px ${String(Math.round(height))}px`, width, height }
      }
      return { css: `${String(Math.round(zoom * 100))}% auto`, width: boxWidth * zoom, height: boxHeight * zoom }
    }

    function clearWallpaper(theme) {
      const body = document.body
      if (body !== null) {
        for (const property of ['background-image', 'background-size', 'background-position', 'background-repeat', 'background-attachment']) {
          body.style.removeProperty(property)
        }
      }
      theme.overrideTokens(OVERRIDE_SOURCE, {})
    }

    function paintWallpaper(theme) {
      const body = document.body
      if (body === null) return
      const background = state.background
      if (background.image === '') {
        clearWallpaper(theme)
        return
      }
      const geometry = backgroundGeometry(background, window.innerWidth, window.innerHeight)
      body.style.setProperty('background-image', `url("${background.image.replaceAll('"', '%22')}")`)
      body.style.setProperty('background-size', geometry.css)
      body.style.setProperty('background-position', `${String(background.position.x)}% ${String(background.position.y)}%`)
      body.style.setProperty('background-repeat', 'no-repeat')
      body.style.setProperty('background-attachment', 'fixed')
      theme.overrideTokens(OVERRIDE_SOURCE, wallpaperTokens(background.cover))
    }

    /** Measure an image URL so framing can be computed in pixels. */
    function measureImage(source) {
      return new Promise((resolve) => {
        const image = new Image()
        // No crossOrigin: reading dimensions needs no CORS grant, and asking for
        // one makes plain image hosts log console errors.
        image.onload = () => {
          resolve(image.naturalWidth > 0 && image.naturalHeight > 0
            ? { w: image.naturalWidth, h: image.naturalHeight }
            : null)
        }
        image.onerror = () => { resolve(null) }
        image.src = source
      })
    }

    function encodeWallpaper(file) {
      return new Promise((resolve, reject) => {
        const bitmap = createImageBitmap(file)
        bitmap.then((bitmap) => {
          for (const [longest, quality] of ATTEMPTS) {
            const scale = Math.min(1, longest / Math.max(bitmap.width, bitmap.height))
            const canvas = document.createElement('canvas')
            canvas.width = Math.max(1, Math.round(bitmap.width * scale))
            canvas.height = Math.max(1, Math.round(bitmap.height * scale))
            const context = canvas.getContext('2d')
            if (context === null) continue
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
            const data = canvas.toDataURL('image/webp', quality)
            if (data.length <= MAX_STORED_LENGTH) {
              resolve({ data, width: canvas.width, height: canvas.height })
              return
            }
          }
          const fallback = document.createElement('canvas')
          fallback.width = 1280
          fallback.height = Math.max(1, Math.round(1280 * bitmap.height / bitmap.width))
          const context = fallback.getContext('2d')
          if (context === null) {
            reject(new Error('canvas unavailable'))
            return
          }
          context.drawImage(bitmap, 0, 0, fallback.width, fallback.height)
          resolve({ data: fallback.toDataURL('image/jpeg', 0.62), width: fallback.width, height: fallback.height })
        }, reject)
      })
    }

    // ------------------------------------------------------------- boot intro

    let activeIntro = null

    function rgba(triplet, alpha) {
      return `rgba(${triplet[0]}, ${triplet[1]}, ${triplet[2]}, ${String(alpha)})`
    }

    function element(tag, className, text) {
      const node = document.createElement(tag)
      if (className !== undefined) node.className = className
      if (text !== undefined) node.textContent = text
      return node
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min)
    }

    /**
     * Mount the intro cover and return its controller.
     *
     * The cover owns the whole gesture: scene switching, the canvas field, the
     * wordmark decode, the simulated meter, and the exit transition. It removes
     * every node, timer, and listener it created.
     *
     * @param intro - resolved intro preferences.
     * @param preview - true when started from the Settings preview button.
     */
    function startIntro(intro, preview) {
      if (typeof document === 'undefined' || document.body === null) return null
      if (activeIntro !== null) {
        activeIntro.dispose()
        activeIntro = null
      }
      const previous = window.__dshAppearanceIntro
      if (previous !== undefined && previous !== null && previous !== activeIntro) {
        try { previous.dispose() } catch { /* already gone */ }
      }

      const preset = PRESETS[intro.preset] ?? PRESETS.cinematic
      const scenes = preset.scenes.map((id) => SCENES[id])
      const palette = ACCENTS[intro.accent] ?? ACCENTS.cyan
      const reduced = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const wordmark = (intro.wordmark.trim() === '' ? WORDMARK_DEFAULT : intro.wordmark.trim()).toUpperCase()
      const duration = Math.round(clamp(intro.duration, DURATION_MIN, DURATION_MAX) * 1000)
      const sceneMs = duration / scenes.length
      const exitMs = 700
      const timers = []
      let frame = null
      let decodeTimer = null
      let shiftTimer = null
      let disposed = false
      let completed = false
      let started = 0
      let lastFrame = 0
      let sceneIndex = 0
      let particles = []
      let width = 0
      let height = 0

      if (!document.getElementById('dsh-appearance-intro-css')) {
        const style = document.createElement('style')
        style.id = 'dsh-appearance-intro-css'
        style.textContent = INTRO_CSS
        document.head.append(style)
      }

      const root = element('div', 'dshfx-root')
      root.dataset.scene = scenes[0].id
      root.dataset.accent = intro.accent in ACCENTS ? intro.accent : 'cyan'
      if (preset.compact) root.dataset.compact = ''
      if (!intro.skip) root.dataset.noskip = ''
      if (reduced) root.dataset.reduced = ''
      if (preview) root.dataset.preview = ''
      root.setAttribute('role', 'presentation')

      const canvas = document.createElement('canvas')
      canvas.className = 'dshfx-field'
      const context = (() => {
        try { return canvas.getContext('2d') } catch { return null }
      })()

      const rings = element('div', 'dshfx-rings')
      rings.append(
        element('span', 'dshfx-ring'),
        element('span', 'dshfx-ring dshfx-ringSlow'),
        element('span', 'dshfx-ring dshfx-ringDash'),
      )

      const wordmarkNode = element('span', 'dshfx-wordmark', reduced ? wordmark : '')
      wordmarkNode.setAttribute('aria-label', wordmark)

      const fill = element('div', 'dshfx-fill')
      const track = element('div', 'dshfx-track')
      track.append(fill)
      const counter = element('span', 'dshfx-counter', `01 / ${String(scenes.length).padStart(2, '0')}`)
      const status = element('span', 'dshfx-status', scenes[0].status)
      const meta = element('div', 'dshfx-meta')
      meta.append(counter, status)

      const stepRow = element('div', 'dshfx-steps')
      const steps = []
      scenes.forEach((scene, index) => {
        const step = element('span', 'dshfx-step')
        step.dataset.step = scene.id
        step.append(
          element('span', 'dshfx-stepDot'),
          element('span', 'dshfx-stepLabel', `${String(index + 1).padStart(2, '0')} ${scene.label}`),
        )
        steps.push(step)
        stepRow.append(step)
      })
      steps[0]?.classList.add('dshfx-stepActive')

      const sceneTag = element('span', 'dshfx-sceneTag',
        `SCENE 01 / ${String(scenes.length).padStart(2, '0')} · ${scenes[0].label}`)

      const center = element('div', 'dshfx-center')
      center.append(
        element('div', 'dshfx-eyebrow', 'DEEPSEEK · AGENT RUNTIME'),
        wordmarkNode,
        element('div', 'dshfx-tagline', 'HARNESS // LOCAL NODE'),
        track,
        meta,
        stepRow,
        element('div', 'dshfx-hint', 'PRESS ESC OR CLICK ANYWHERE · 点击任意处跳过'),
      )

      const skip = document.createElement('button')
      skip.type = 'button'
      skip.className = 'dshfx-skip'
      skip.setAttribute('aria-label', '跳过开场动画')
      skip.append(
        element('span', 'dshfx-skipZh', '跳过'),
        element('span', undefined, 'SKIP INTRO'),
        element('span', 'dshfx-skipKey', 'ESC'),
      )

      root.append(
        canvas,
        element('div', 'dshfx-grid'),
        element('div', 'dshfx-halo'),
        rings,
        element('div', 'dshfx-scan'),
        element('div', 'dshfx-flash'),
        element('div', 'dshfx-hud dshfx-hudLeft'),
        element('div', 'dshfx-hud dshfx-hudRight'),
        center,
        sceneTag,
        element('div', 'dshfx-corner dshfx-cornerTopLeft'),
        element('div', 'dshfx-corner dshfx-cornerTopRight'),
        element('div', 'dshfx-corner dshfx-cornerBottomLeft'),
        element('div', 'dshfx-corner dshfx-cornerBottomRight'),
        skip,
      )
      document.body.append(root)
      resize()

      function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        width = window.innerWidth
        height = window.innerHeight
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
        if (context !== null) context.setTransform(ratio, 0, 0, ratio, 0, 0)
        seed()
      }

      function seed() {
        const maxRadius = Math.hypot(width / 2, height / 2)
        const minRadius = Math.min(width, height)
        if (preset.paint === 'mesh') {
          particles = Array.from({ length: 168 }, () => ({
            kind: 'mesh',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.26,
            vy: (Math.random() - 0.5) * 0.26,
            radius: randomBetween(0.8, 2.6),
            alpha: randomBetween(0.3, 0.9),
          }))
          return
        }
        if (preset.paint === 'aurora') {
          particles = Array.from({ length: 3 }, (_, index) => ({ kind: 'aurora', band: index }))
          return
        }
        if (preset.paint === 'scenes') {
          if (sceneIndex === 0) {
            particles = Array.from({ length: 150 }, () => ({
              kind: 'warp',
              angle: randomBetween(0, Math.PI * 2),
              radius: randomBetween(16, maxRadius),
              speed: randomBetween(1.1, 3.4),
              length: randomBetween(60, 220),
              alpha: randomBetween(0.16, 0.62),
            }))
            return
          }
          if (sceneIndex === 1) {
            particles = Array.from({ length: 84 }, () => ({
              kind: 'mesh',
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 0.18,
              vy: (Math.random() - 0.5) * 0.18,
              radius: randomBetween(0.7, 2.3),
              alpha: randomBetween(0.25, 0.8),
            }))
            return
          }
          if (sceneIndex === 2) {
            particles = Array.from({ length: 130 }, () => ({
              kind: 'orbit',
              angle: randomBetween(0, Math.PI * 2),
              radius: randomBetween(64, minRadius * 0.46),
              speed: randomBetween(0.0035, 0.012) * (Math.random() < 0.5 ? -1 : 1),
              size: randomBetween(0.6, 2.4),
              alpha: randomBetween(0.2, 0.72),
            }))
            return
          }
          particles = Array.from({ length: 150 }, () => ({
            kind: 'core',
            angle: randomBetween(0, Math.PI * 2),
            radius: randomBetween(48, maxRadius),
            speed: randomBetween(0.7, 2.4),
            alpha: randomBetween(0.2, 0.7),
          }))
          return
        }
        particles = []
      }

      function paintWarp(dt) {
        const cx = width / 2
        const cy = height / 2
        const maxRadius = Math.hypot(cx, cy) + 90
        context.globalCompositeOperation = 'lighter'
        for (const particle of particles) {
          if (particle.kind !== 'warp') continue
          particle.radius += particle.speed * dt * 5.2
          if (particle.radius > maxRadius) {
            particle.radius = randomBetween(10, 40)
            particle.angle = randomBetween(0, Math.PI * 2)
          }
          const near = 1 - Math.min(particle.radius / maxRadius, 1)
          const cos = Math.cos(particle.angle)
          const sin = Math.sin(particle.angle)
          const tail = particle.length * (0.3 + near * 0.9)
          context.strokeStyle = rgba(palette.rgb5, particle.alpha * (0.35 + near * 0.65))
          context.lineWidth = 0.6 + near * 1.8
          context.beginPath()
          context.moveTo(cx + cos * particle.radius, cy + sin * particle.radius)
          context.lineTo(cx + cos * (particle.radius - tail), cy + sin * (particle.radius - tail))
          context.stroke()
        }
        const glow = context.createRadialGradient(cx, cy, 0, cx, cy, 150)
        glow.addColorStop(0, rgba(palette.rgb, 0.4))
        glow.addColorStop(0.35, rgba(palette.rgb2, 0.14))
        glow.addColorStop(1, rgba(palette.rgb2, 0))
        context.fillStyle = glow
        context.beginPath()
        context.arc(cx, cy, 150, 0, Math.PI * 2)
        context.fill()
        context.globalCompositeOperation = 'source-over'
      }

      function paintMesh(dt) {
        const linkDistance = preset.paint === 'mesh' ? 172 : 118
        for (const particle of particles) {
          if (particle.kind !== 'mesh') continue
          particle.x += particle.vx * dt
          particle.y += particle.vy * dt
          if (particle.x < -20) particle.x = width + 20
          else if (particle.x > width + 20) particle.x = -20
          if (particle.y < -20) particle.y = height + 20
          else if (particle.y > height + 20) particle.y = -20
        }
        for (let index = 0; index < particles.length; index++) {
          const left = particles[index]
          if (left.kind !== 'mesh') continue
          for (let other = index + 1; other < particles.length; other++) {
            const right = particles[other]
            if (right.kind !== 'mesh') continue
            const distance = Math.hypot(left.x - right.x, left.y - right.y)
            if (distance > linkDistance) continue
            context.strokeStyle = rgba(palette.rgb, (1 - distance / linkDistance) * 0.26)
            context.lineWidth = 0.6
            context.beginPath()
            context.moveTo(left.x, left.y)
            context.lineTo(right.x, right.y)
            context.stroke()
          }
        }
        for (const particle of particles) {
          if (particle.kind !== 'mesh') continue
          context.fillStyle = rgba(palette.rgb5, particle.alpha)
          context.beginPath()
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
          context.fill()
        }
      }

      function paintOrbit(dt) {
        const cx = width / 2
        const cy = height / 2
        context.globalCompositeOperation = 'lighter'
        for (const particle of particles) {
          if (particle.kind !== 'orbit') continue
          particle.angle += particle.speed * dt
          const trail = 0.16 + Math.abs(particle.speed) * 14
          context.strokeStyle = rgba(palette.rgb, particle.alpha * 0.3)
          context.lineWidth = 0.8
          context.beginPath()
          context.arc(cx, cy, particle.radius, particle.angle - trail, particle.angle)
          context.stroke()
          context.fillStyle = rgba(palette.rgb9, particle.alpha)
          context.beginPath()
          context.arc(cx + Math.cos(particle.angle) * particle.radius,
            cy + Math.sin(particle.angle) * particle.radius, particle.size, 0, Math.PI * 2)
          context.fill()
        }
        for (const [scale, tilt, alpha] of [[1, 0, 0.18], [0.72, 1.1, 0.12], [0.46, -0.7, 0.1]]) {
          context.strokeStyle = rgba(palette.rgb3, alpha)
          context.lineWidth = 1
          context.beginPath()
          context.ellipse(cx, cy, Math.min(width, height) * 0.42 * scale,
            Math.min(width, height) * 0.42 * scale * 0.42, tilt, 0, Math.PI * 2)
          context.stroke()
        }
        context.globalCompositeOperation = 'source-over'
      }

      function paintCore(dt) {
        const cx = width / 2
        const cy = height / 2
        const maxRadius = Math.hypot(cx, cy) + 60
        context.globalCompositeOperation = 'lighter'
        for (const particle of particles) {
          if (particle.kind !== 'core') continue
          particle.radius -= particle.speed * dt * 2.1
          particle.angle += 0.014 * dt
          if (particle.radius < 30) particle.radius = randomBetween(maxRadius * 0.7, maxRadius)
          const near = 1 - Math.min(particle.radius / maxRadius, 1)
          const cos = Math.cos(particle.angle)
          const sin = Math.sin(particle.angle)
          context.strokeStyle = rgba(palette.rgb5, particle.alpha * (0.2 + near * 0.8))
          context.lineWidth = 0.6 + near * 1.2
          context.beginPath()
          context.moveTo(cx + cos * particle.radius, cy + sin * particle.radius)
          context.lineTo(cx + cos * (particle.radius + 16), cy + sin * (particle.radius + 16))
          context.stroke()
        }
        const pulse = 0.5 + Math.sin(performance.now() / 260) * 0.5
        const glow = context.createRadialGradient(cx, cy, 0, cx, cy, 190)
        glow.addColorStop(0, rgba(palette.rgb, 0.3 + pulse * 0.18))
        glow.addColorStop(0.4, rgba(palette.rgb2, 0.12))
        glow.addColorStop(1, rgba(palette.rgb2, 0))
        context.fillStyle = glow
        context.beginPath()
        context.arc(cx, cy, 190, 0, Math.PI * 2)
        context.fill()
        context.strokeStyle = rgba(palette.rgb, 0.24 + pulse * 0.24)
        context.lineWidth = 1.2
        context.beginPath()
        for (let corner = 0; corner < 6; corner++) {
          const angle = corner * Math.PI / 3 - Math.PI / 2
          const radius = 36 + pulse * 8
          const x = cx + Math.cos(angle) * radius
          const y = cy + Math.sin(angle) * radius
          if (corner === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.closePath()
        context.stroke()
        context.globalCompositeOperation = 'source-over'
      }

      function paintAurora(dt, elapsed) {
        const phase = elapsed * 0.00035
        context.globalCompositeOperation = 'lighter'
        for (const particle of particles) {
          const band = particle.band
          const amplitude = height * 0.1 + band * 26
          const baseY = height * (0.34 + band * 0.1)
          const gradient = context.createLinearGradient(0, baseY - amplitude, width, baseY + amplitude)
          gradient.addColorStop(0, rgba(palette.rgb, 0))
          gradient.addColorStop(0.32, rgba(band % 2 === 0 ? palette.rgb : palette.rgb2, 0.3))
          gradient.addColorStop(0.64, rgba(palette.rgb3, 0.2))
          gradient.addColorStop(1, rgba(palette.rgb, 0))
          context.strokeStyle = gradient
          context.lineWidth = 30 - band * 6
          context.beginPath()
          for (let x = 0; x <= width; x += 16) {
            const y = baseY
              + Math.sin(x * 0.006 + phase * (1 + band * 0.4) + band * 1.7) * amplitude * 0.5
              + Math.sin(x * 0.014 - phase * 1.6) * amplitude * 0.2
            if (x === 0) context.moveTo(x, y)
            else context.lineTo(x, y)
          }
          context.stroke()
        }
        const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.46)
        glow.addColorStop(0, rgba(palette.rgb, 0.16))
        glow.addColorStop(1, rgba(palette.rgb2, 0))
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)
        context.globalCompositeOperation = 'source-over'
      }

      function paint(dt, elapsed) {
        if (context === null || reduced) return
        context.clearRect(0, 0, width, height)
        if (preset.paint === 'aurora') paintAurora(dt, elapsed)
        else if (preset.paint === 'mesh') paintMesh(dt)
        else if (preset.paint === 'scenes') {
          if (sceneIndex === 0) paintWarp(dt)
          else if (sceneIndex === 1) paintMesh(dt)
          else if (sceneIndex === 2) paintOrbit(dt)
          else paintCore(dt)
        }
      }

      function enterScene(index) {
        const scene = scenes[index]
        if (scene === undefined) return
        sceneIndex = index
        root.dataset.scene = scene.id
        status.textContent = scene.status
        sceneTag.textContent = `SCENE ${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')} · ${scene.label}`
        counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`
        steps.forEach((step, stepIndex) => {
          step.classList.toggle('dshfx-stepActive', stepIndex === index)
          step.classList.toggle('dshfx-stepDone', stepIndex < index)
        })
        seed()
        root.dataset.shift = ''
        if (shiftTimer !== null) clearTimeout(shiftTimer)
        shiftTimer = window.setTimeout(() => {
          shiftTimer = null
          delete root.dataset.shift
        }, 240)
      }

      function startDecode() {
        if (reduced) return
        const finalized = new Set()
        decodeTimer = window.setInterval(() => {
          if (completed || disposed) {
            if (decodeTimer !== null) clearInterval(decodeTimer)
            decodeTimer = null
            return
          }
          const elapsed = started === 0 ? 0 : performance.now() - started
          const limit = Math.floor(elapsed / 55)
          let text = ''
          for (let index = 0; index < wordmark.length; index++) {
            const target = wordmark[index]
            if (target === ' ') text += ' '
            else if (finalized.has(index) || index < limit) {
              finalized.add(index)
              text += target
            } else text += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          }
          wordmarkNode.textContent = text
          if (finalized.size >= wordmark.replaceAll(' ', '').length && decodeTimer !== null) {
            clearInterval(decodeTimer)
            decodeTimer = null
            wordmarkNode.textContent = wordmark
          }
        }, 45)
      }

      function loop(timestamp) {
        if (disposed) return
        if (started === 0) {
          started = timestamp
          lastFrame = timestamp
        }
        const dt = Math.min(48, timestamp - lastFrame)
        lastFrame = timestamp
        const elapsed = timestamp - started
        if (!completed) {
          const wanted = Math.min(scenes.length - 1, Math.floor(elapsed / sceneMs))
          if (wanted !== sceneIndex) enterScene(wanted)
          const ratio = Math.min(0.96, 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 3))
          fill.style.transform = `scaleX(${ratio.toFixed(4)})`
          if (elapsed >= duration) complete()
        }
        paint(dt, elapsed)
        if (!completed) frame = window.requestAnimationFrame(loop)
      }

      function complete() {
        if (completed || disposed) return
        completed = true
        root.dataset.ready = ''
        status.textContent = 'SYSTEM READY'
        sceneTag.textContent = `SYSTEM READY · ${String(scenes.length).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`
        counter.textContent = `${String(scenes.length).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`
        fill.style.transform = 'scaleX(1)'
        for (const step of steps) {
          step.classList.remove('dshfx-stepActive')
          step.classList.add('dshfx-stepDone')
        }
        if (!reduced) root.dataset.flash = ''
        timers.push(window.setTimeout(() => {
          delete root.dataset.flash
          exit()
        }, 320))
      }

      function exit() {
        if (disposed) return
        root.dataset.exiting = ''
        timers.push(window.setTimeout(() => { dispose() }, exitMs))
      }

      function dispose() {
        if (disposed) return
        disposed = true
        if (frame !== null) cancelAnimationFrame(frame)
        frame = null
        if (decodeTimer !== null) clearInterval(decodeTimer)
        decodeTimer = null
        for (const timer of timers) clearTimeout(timer)
        if (shiftTimer !== null) clearTimeout(shiftTimer)
        window.removeEventListener('resize', resize)
        root.removeEventListener('pointerdown', skipPointer)
        window.removeEventListener('keydown', skipKey)
        skip.removeEventListener('click', skipClick)
        root.remove()
        if (activeIntro !== null && activeIntro.root === root) activeIntro = null
        if (window.__dshAppearanceIntro !== undefined && window.__dshAppearanceIntro.root === root) {
          window.__dshAppearanceIntro = undefined
        }
      }

      function skipNow() {
        if (completed || disposed) return
        if (intro.skip) dispose()
      }

      function skipPointer(event) {
        event.preventDefault()
        skipNow()
      }

      function skipClick(event) {
        event.stopPropagation()
        skipNow()
      }

      function skipKey(event) {
        if (event.key === 'Escape') skipNow()
      }

      if (intro.skip) {
        root.addEventListener('pointerdown', skipPointer)
        window.addEventListener('keydown', skipKey)
        skip.addEventListener('click', skipClick)
      }
      window.addEventListener('resize', resize)

      startDecode()
      frame = window.requestAnimationFrame(loop)
      timers.push(window.setTimeout(() => { complete() }, duration + 60))

      const controller = {
        root,
        dispose,
        finish: complete,
      }
      activeIntro = controller
      window.__dshAppearanceIntro = controller
      return controller
    }

    // ------------------------------------------------------------------ styles

    const SETTINGS_CSS = `
.dshap-page { display: flex; flex-direction: column; width: 100%; }
.dshap-group { padding: 18px 0 2px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); letter-spacing: .02em; }
.dshap-item { border-bottom: .5px solid var(--dsw-alias-border-l2); padding: 14px 0; }
.dshap-item:last-child { border-bottom: none; }
.dshap-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.dshap-title { font-size: 14px; line-height: 20px; color: var(--dsw-alias-label-primary); }
.dshap-desc { margin-top: 4px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.dshap-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.dshap-btn { border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 18px; padding: 6px 12px; cursor: pointer; }
.dshap-btn:hover { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
.dshap-btn:disabled { opacity: .6; cursor: default; }
/* Filled action: the platform's primary fill is white in a dark theme and
 * near-black in a light one, so label and hover come from the matching alias
 * tokens instead of literal white. Fallbacks keep older themes readable. */
.dshap-btn-strong { border-color: transparent; background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary)); color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base)); }
.dshap-btn-strong:hover { background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-bg-layer-2)); border-color: transparent; }
.dshap-slider { margin-top: 12px; }
.dshap-sliderHead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.dshap-sliderHead b { font-weight: 500; color: var(--dsw-alias-label-primary); font-variant-numeric: tabular-nums; }
.dshap-slider input { width: 100%; margin: 8px 0 0; accent-color: var(--dsw-alias-brand-primary); }
.dshap-field { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 10px 0; }
.dshap-fieldText { min-width: 0; }
.dshap-fieldLabel { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-primary); }
.dshap-fieldHint { margin-top: 2px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.dshap-input { box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 18px; padding: 6px 10px; min-width: 220px; max-width: 260px; }
.dshap-input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dshap-range { width: 220px; accent-color: var(--dsw-alias-brand-primary); }
.dshap-rangeValue { min-width: 42px; text-align: right; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.dshap-inline { display: flex; align-items: center; gap: 10px; }
.dshap-note { padding: 4px 0 14px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }

/* Built-in walls are drawn on a canvas at apply time, so the package ships no
 * binary assets and every preset stays resolution independent. */
.dshap-wallHead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-top: 12px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.dshap-wallHint { color: var(--dsw-alias-label-secondary); opacity: .8; }
.dshap-wallGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; margin-top: 8px; }
.dshap-wallChip { position: relative; aspect-ratio: 16 / 9; padding: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background-color: var(--dsw-alias-bg-layer-2); background-size: cover; background-position: center; overflow: hidden; cursor: pointer; transition: border-color 140ms ease, transform 140ms ease; }
.dshap-wallChip:hover { border-color: var(--dsw-alias-border-l3); transform: translateY(-1px); }
.dshap-wallChip[aria-pressed='true'] { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary); }
.dshap-wallChip:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dshap-wallName { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 6px 4px; font-size: 10px; line-height: 13px; text-align: left; color: #ffffff; background: linear-gradient(rgb(0 0 0 / 0), rgb(0 0 0 / .62)); }

/* Switch: native checkboxes pick up the OS accent and clash with the shell.
 * Track and thumb follow the platform Switch tokens: brand-primary is the
 * near-black ink in light and the near-white ink in dark, so the thumb must
 * come from label-primary-foreground, never a literal white. */
.dshap-toggle { position: relative; flex: none; width: 40px; height: 22px; padding: 0; border: 0; border-radius: 999px; background: var(--dsw-alias-border-l3); cursor: pointer; transition: background 160ms ease; }
.dshap-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-switch-thumb, var(--dsw-alias-label-secondary)); transition: transform 160ms cubic-bezier(.16, 1, .3, 1), background 160ms ease; }
.dshap-toggle[aria-checked='true'] { background: var(--dsw-alias-brand-primary); }
.dshap-toggle[aria-checked='true']::after { transform: translateX(18px); background: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base)); }
.dshap-toggle:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dshap-toggle:disabled { opacity: .5; cursor: default; }

/* Dropdown: a native <select> popup is painted by the OS and stays white in a
 * dark shell, so the menu is drawn from theme tokens instead. */
.dshap-dd { position: relative; flex: none; }
.dshap-ddBtn { display: inline-flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 168px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 18px; padding: 6px 10px; cursor: pointer; transition: border-color 140ms ease, background 140ms ease; }
.dshap-ddBtn:hover { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
.dshap-ddBtn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dshap-ddBtn[aria-expanded='true'] { border-color: var(--dsw-alias-brand-primary); }
.dshap-ddValue { display: inline-flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dshap-ddChevron { flex: none; opacity: .7; transition: transform 160ms ease; }
.dshap-ddBtn[aria-expanded='true'] .dshap-ddChevron { transform: rotate(180deg); }
.dshap-ddMenu { position: fixed; z-index: 2147483200; box-sizing: border-box; overflow: auto; padding: 6px; border-radius: 10px; border: .5px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); box-shadow: 0 18px 44px rgb(0 0 0 / .28), 0 2px 8px rgb(0 0 0 / .18); }
.dshap-ddOption { display: flex; align-items: center; gap: 9px; width: 100%; box-sizing: border-box; padding: 8px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 18px; text-align: left; cursor: pointer; }
.dshap-ddOption:hover, .dshap-ddOption:focus-visible { background: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent); outline: none; }
.dshap-ddOption[aria-selected='true'] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); }
.dshap-ddLabel { flex: 1 1 auto; min-width: 0; white-space: nowrap; }
.dshap-ddHint { display: block; margin-top: 2px; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-secondary); white-space: normal; }
.dshap-ddCheck { flex: none; color: var(--dsw-alias-brand-primary); }
.dshap-swatch { width: 10px; height: 10px; border-radius: 50%; flex: none; box-shadow: 0 0 0 1px rgb(255 255 255 / .28) inset; }

/* Framing stage: the live wallpaper geometry, draggable. */
.dshap-stage { position: relative; margin-top: 12px; aspect-ratio: 16 / 7; border-radius: 10px; overflow: hidden; border: .5px solid var(--dsw-alias-border-l2); background-color: var(--dsw-alias-bg-layer-2); background-repeat: no-repeat; background-position: center; background-size: cover; cursor: grab; touch-action: none; user-select: none; }
.dshap-stage:active { cursor: grabbing; }
.dshap-stageBadge { position: absolute; right: 8px; bottom: 8px; padding: 3px 8px; border-radius: 999px; background: rgb(0 0 0 / .48); color: #ffffff; font-size: 11px; line-height: 15px; letter-spacing: .02em; backdrop-filter: blur(6px); }
.dshap-urlRow { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.dshap-urlInput { flex: 1 1 auto; min-width: 0; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 18px; padding: 6px 10px; }
.dshap-urlInput:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dshap-error { margin-top: 6px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-error-primary); }
`

    // --------------------------------------------------------------------- UI

    /**
     * Token-styled listbox. A native `<select>` popup is painted by the OS and
     * stays white inside a dark shell, so this draws its own menu: it inherits
     * the theme surfaces, closes on outside click, Escape, or scroll, and is
     * positioned fixed so a scrolling settings column cannot clip it.
     */
    function Dropdown({ value, options, onChange, label }) {
      const [open, setOpen] = React.useState(false)
      const [placement, setPlacement] = React.useState(null)
      const container = React.useRef(null)
      const trigger = React.useRef(null)

      const place = React.useCallback(() => {
        const node = trigger.current
        if (node === null) return
        const rect = node.getBoundingClientRect()
        const estimate = Math.min(options.length * 46 + 12, 300)
        const below = window.innerHeight - rect.bottom - 12
        const above = rect.top - 12
        const side = below >= Math.min(estimate, 220) || below >= above ? 'below' : 'above'
        const height = Math.max(120, Math.min(estimate, side === 'below' ? below : above))
        const width = Math.max(rect.width, 220)
        setPlacement({
          top: side === 'below' ? rect.bottom + 6 : rect.top - height - 6,
          left: Math.min(rect.left, Math.max(0, window.innerWidth - width - 12)),
          width,
          height,
        })
      }, [options.length])

      React.useEffect(() => {
        if (!open) return undefined
        place()
        const onPointer = (event) => {
          if (container.current !== null && !container.current.contains(event.target)) setOpen(false)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            setOpen(false)
          }
        }
        // The menu is fixed-positioned, so follow the trigger instead of
        // closing when the settings column scrolls it into place.
        let frame = 0
        const reposition = () => {
          if (frame !== 0) return
          frame = window.requestAnimationFrame(() => {
            frame = 0
            place()
          })
        }
        document.addEventListener('pointerdown', onPointer, true)
        document.addEventListener('keydown', onKey)
        window.addEventListener('scroll', reposition, true)
        window.addEventListener('resize', reposition)
        return () => {
          document.removeEventListener('pointerdown', onPointer, true)
          document.removeEventListener('keydown', onKey)
          window.removeEventListener('scroll', reposition, true)
          window.removeEventListener('resize', reposition)
          if (frame !== 0) window.cancelAnimationFrame(frame)
        }
      }, [open, place])

      const current = options.find((option) => option.value === value) ?? options[0]
      return h('div', { className: 'dshap-dd', ref: container },
        h('button', {
          ref: trigger,
          type: 'button',
          className: 'dshap-ddBtn',
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          'aria-label': label,
          onClick: () => { setOpen((open) => !open) },
        },
        h('span', { className: 'dshap-ddValue' },
          current?.swatch === undefined ? null : h('span', { className: 'dshap-swatch', style: { background: current.swatch } }),
          h('span', null, current?.label ?? value)),
        h('svg', {
          className: 'dshap-ddChevron',
          width: 12,
          height: 12,
          viewBox: '0 0 12 12',
          'aria-hidden': 'true',
        }, h('path', {
          d: 'M2.5 4.5L6 8L9.5 4.5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }))),
        open && placement !== null ? h('div', {
          className: 'dshap-ddMenu',
          role: 'listbox',
          style: {
            top: `${String(Math.round(placement.top))}px`,
            left: `${String(Math.round(placement.left))}px`,
            width: `${String(Math.round(placement.width))}px`,
            maxHeight: `${String(Math.round(placement.height))}px`,
          },
        }, options.map((option) => h('button', {
          key: option.value,
          type: 'button',
          role: 'option',
          'aria-selected': option.value === value,
          className: 'dshap-ddOption',
          onClick: () => {
            onChange(option.value)
            setOpen(false)
          },
        },
        option.swatch === undefined ? null : h('span', { className: 'dshap-swatch', style: { background: option.swatch } }),
        h('span', { className: 'dshap-ddLabel' },
          h('span', null, option.label),
          option.hint === undefined ? null : h('span', { className: 'dshap-ddHint' }, option.hint)),
        option.value === value ? h('span', { className: 'dshap-ddCheck', 'aria-hidden': 'true' }, '✓') : null))) : null)
    }

    /** Accessible switch; native checkboxes keep the OS accent colour. */
    function Toggle({ checked, onChange, label }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        'aria-label': label,
        className: 'dshap-toggle',
        onClick: () => { onChange(!checked) },
      })
    }

    function BackgroundItem({ snapshot }) {
      const fileInput = React.useRef(null)
      const stage = React.useRef(null)
      const drag = React.useRef(null)
      const [busy, setBusy] = React.useState(false)
      const [box, setBox] = React.useState({ w: 0, h: 0 })
      const [urlDraft, setUrlDraft] = React.useState('')
      const [urlError, setUrlError] = React.useState(false)
      const background = snapshot.background
      const hasImage = background.image !== ''
      const cover = Math.round(background.cover)
      const zoom = background.zoom ?? 1
      const position = background.position

      React.useEffect(() => {
        const element = stage.current
        if (element === null || typeof ResizeObserver === 'undefined') return undefined
        const measure = () => { setBox({ w: element.clientWidth, h: element.clientHeight }) }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => { observer.disconnect() }
      }, [hasImage])

      // Wheel has to be non-passive so zooming does not scroll the panel.
      React.useEffect(() => {
        const element = stage.current
        if (element === null) return undefined
        const onWheel = (event) => {
          event.preventDefault()
          const base = state.background.zoom ?? 1
          const next = clamp(base + (event.deltaY < 0 ? 0.06 : -0.06), ZOOM_MIN, ZOOM_MAX)
          patchBackground({ zoom: Math.round(next * 100) / 100 })
        }
        element.addEventListener('wheel', onWheel, { passive: false })
        return () => { element.removeEventListener('wheel', onWheel) }
      }, [hasImage])

      async function choose(event) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file === undefined || file.size > MAX_SOURCE_BYTES) return
        setBusy(true)
        try {
          const encoded = await encodeWallpaper(file)
          patchBackground({
            image: encoded.data,
            preset: null,
            size: { w: encoded.width, h: encoded.height },
            zoom: 1,
            position: { x: 50, y: 50 },
          })
        } catch {
          // Unreadable image: leave the previous wallpaper in place.
        } finally {
          setBusy(false)
        }
      }

      async function loadUrl() {
        const source = urlDraft.trim()
        if (!/^(https?:\/\/|data:image\/)/i.test(source)) {
          setUrlError(true)
          return
        }
        setUrlError(false)
        setBusy(true)
        try {
          const size = await measureImage(source)
          patchBackground({ image: source, preset: null, size, zoom: 1, position: { x: 50, y: 50 } })
          setUrlDraft('')
        } finally {
          setBusy(false)
        }
      }

      function startDrag(event) {
        if (event.button !== 0) return
        drag.current = { x: event.clientX, y: event.clientY, px: position.x, py: position.y }
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }

      function moveDrag(event) {
        const start = drag.current
        if (start === null) return
        const geometry = backgroundGeometry(background, box.w, box.h)
        const overflowX = Math.max(0, geometry.width - box.w)
        const overflowY = Math.max(0, geometry.height - box.h)
        const nextX = overflowX > 1 ? clamp(start.px - ((event.clientX - start.x) / overflowX) * 100, 0, 100) : start.px
        const nextY = overflowY > 1 ? clamp(start.py - ((event.clientY - start.y) / overflowY) * 100, 0, 100) : start.py
        patchBackground({ position: { x: Math.round(nextX * 10) / 10, y: Math.round(nextY * 10) / 10 } })
      }

      function endDrag() { drag.current = null }

      function recentre() {
        patchBackground({ position: { x: 50, y: 50 }, zoom: 1 })
      }

      // Thumbnails are drawn once at mount: six small canvases, no assets.
      const wallpapers = React.useMemo(() => WALLPAPERS.map((entry) => {
        const canvas = renderWallpaper(entry, THUMB_WIDTH, THUMB_HEIGHT)
        return {
          key: entry.key,
          label: wallpaperLabel(entry),
          thumb: canvas === null ? '' : canvas.toDataURL('image/webp', 0.7),
        }
      }), [])

      function applyBuiltin(key) {
        const entry = WALLPAPERS.find((candidate) => candidate.key === key)
        if (entry === undefined) return
        const canvas = renderWallpaper(entry, WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
        if (canvas === null) return
        let data = canvas.toDataURL('image/webp', 0.84)
        if (data.length > MAX_STORED_LENGTH) data = canvas.toDataURL('image/webp', 0.7)
        if (data.length > MAX_STORED_LENGTH) data = canvas.toDataURL('image/jpeg', 0.72)
        if (data.length > MAX_STORED_LENGTH) return
        patchBackground({
          image: data,
          preset: entry.key,
          size: { w: canvas.width, h: canvas.height },
          zoom: 1,
          position: { x: 50, y: 50 },
        })
      }

      const geometry = hasImage && box.w > 0 ? backgroundGeometry(background, box.w, box.h) : null
      const stageStyle = hasImage
        ? {
            backgroundImage: `url("${background.image.replaceAll('"', '%22')}")`,
            backgroundSize: geometry === null ? 'cover' : geometry.css,
            backgroundPosition: `${String(position.x)}% ${String(position.y)}%`,
          }
        : undefined

      return h('div', { className: 'dshap-item' },
        h('div', { className: 'dshap-row' },
          h('div', null,
            h('div', { className: 'dshap-title' }, t('bg.title')),
            h('div', { className: 'dshap-desc' }, t('bg.desc'))),
          h('div', { className: 'dshap-actions' },
            h('input', {
              ref: fileInput,
              type: 'file',
              accept: 'image/*',
              style: { display: 'none' },
              onChange: choose,
            }),
            h('button', {
              type: 'button',
              className: 'dshap-btn dshap-btn-strong',
              disabled: busy,
              onClick: () => { fileInput.current?.click() },
            }, busy ? t('bg.loading') : hasImage ? t('bg.change') : t('bg.choose')),
            hasImage ? h('button', {
              type: 'button',
              className: 'dshap-btn',
              onClick: recentre,
            }, t('bg.reset')) : null,
            hasImage ? h('button', {
              type: 'button',
              className: 'dshap-btn',
              onClick: () => { patchBackground({ image: '', preset: null, size: null }) },
            }, t('bg.remove')) : null)),
        h('div', { className: 'dshap-wallHead' },
          h('span', null, t('bg.builtin')),
          h('span', { className: 'dshap-wallHint' }, t('bg.builtinHint'))),
        h('div', { className: 'dshap-wallGrid' },
          wallpapers.map((entry) => h('button', {
            key: entry.key,
            type: 'button',
            className: 'dshap-wallChip',
            'aria-pressed': background.preset === entry.key,
            title: entry.label,
            style: entry.thumb === '' ? undefined : { backgroundImage: `url("${entry.thumb}")` },
            onClick: () => { applyBuiltin(entry.key) },
          }, h('span', { className: 'dshap-wallName' }, entry.label)))),
        h('div', { className: 'dshap-urlRow' },
          h('input', {
            type: 'url',
            className: 'dshap-urlInput',
            value: urlDraft,
            placeholder: 'https://… / data:image/…',
            spellCheck: false,
            onChange: (event) => {
              setUrlDraft(event.target.value)
              setUrlError(false)
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void loadUrl()
              }
            },
          }),
          h('button', {
            type: 'button',
            className: 'dshap-btn',
            disabled: busy || urlDraft.trim() === '',
            onClick: () => { void loadUrl() },
          }, t('bg.load'))),
        h('div', { className: 'dshap-desc' }, t('bg.urlHint')),
        urlError ? h('div', { className: 'dshap-error' }, t('bg.urlInvalid')) : null,
        hasImage ? h('div', {
          ref: stage,
          className: 'dshap-stage',
          style: stageStyle,
          onPointerDown: startDrag,
          onPointerMove: moveDrag,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
          onDoubleClick: recentre,
        }, h('span', { className: 'dshap-stageBadge' }, `${String(Math.round(zoom * 100))}%`)) : null,
        hasImage ? h('div', { className: 'dshap-desc', style: { marginTop: '8px' } }, t('bg.framingHint')) : null,
        hasImage ? h('div', { className: 'dshap-slider' },
          h('div', { className: 'dshap-sliderHead' },
            h('span', null, t('bg.zoom')),
            h('b', null, `${String(Math.round(zoom * 100))}%`)),
          h('input', {
            type: 'range',
            min: Math.round(ZOOM_MIN * 100),
            max: Math.round(ZOOM_MAX * 100),
            step: 1,
            value: Math.round(zoom * 100),
            onChange: (event) => { patchBackground({ zoom: Number(event.target.value) / 100 }) },
          })) : null,
        hasImage ? h('div', { className: 'dshap-slider' },
          h('div', { className: 'dshap-sliderHead' },
            h('span', null, t('bg.veil')),
            h('b', null, `${String(cover)}%`)),
          h('input', {
            type: 'range',
            min: COVER_MIN,
            max: COVER_MAX,
            step: 1,
            value: cover,
            onChange: (event) => { patchBackground({ cover: Number(event.target.value) }) },
          }),
          h('div', { className: 'dshap-desc' }, t('bg.veilHint'))) : null,
      )
    }

    function IntroItems({ snapshot }) {
      const intro = snapshot.intro
      const preset = PRESETS[intro.preset] ?? PRESETS.cinematic
      const [wordmark, setWordmark] = React.useState(intro.wordmark)
      const [previewing, setPreviewing] = React.useState(false)

      React.useEffect(() => { setWordmark(intro.wordmark) }, [intro.wordmark])

      function preview() {
        setPreviewing(true)
        const controller = startIntro({ ...intro, skip: true }, true)
        window.setTimeout(() => { setPreviewing(false) }, Math.round(intro.duration * 1000) + 200)
        if (controller === null) setPreviewing(false)
      }

      function field(label, hint, control) {
        return h('div', { className: 'dshap-field' },
          h('div', { className: 'dshap-fieldText' },
            h('div', { className: 'dshap-fieldLabel' }, label),
            hint === null ? null : h('div', { className: 'dshap-fieldHint' }, hint)),
          control)
      }

      const presetOptions = Object.entries(PRESETS).map(([key, value]) => ({
        value: key,
        label: presetLabel(value),
        hint: presetHint(value),
      }))
      const accentOptions = Object.entries(ACCENTS).map(([key, value]) => ({
        value: key,
        label: accentLabel(value),
        swatch: value.swatch,
      }))

      return h(React.Fragment, null,
        field(t('intro.enable'), t('intro.enableDesc'), h(Toggle, {
          checked: intro.enabled,
          label: t('intro.enable'),
          onChange: (next) => { patchIntro({ enabled: next }) },
        })),
        field(t('intro.preset'), presetHint(preset), h(Dropdown, {
          value: intro.preset,
          options: presetOptions,
          label: t('intro.preset'),
          onChange: (next) => { patchIntro({ preset: next }) },
        })),
        field(t('intro.accent'), null, h(Dropdown, {
          value: intro.accent,
          options: accentOptions,
          label: t('intro.accent'),
          onChange: (next) => { patchIntro({ accent: next }) },
        })),
        field(t('intro.duration'), t('intro.durationHint'), h('div', { className: 'dshap-inline' },
          h('input', {
            type: 'range',
            className: 'dshap-range',
            min: DURATION_MIN,
            max: DURATION_MAX,
            step: 0.1,
            value: intro.duration,
            onChange: (event) => { patchIntro({ duration: Number(event.target.value) }) },
          }),
          h('span', { className: 'dshap-rangeValue' }, `${intro.duration.toFixed(1)}s`))),
        field(t('intro.wordmark'), t('intro.wordmarkHint'), h('input', {
          type: 'text',
          className: 'dshap-input',
          maxLength: 28,
          value: wordmark,
          placeholder: WORDMARK_DEFAULT,
          onChange: (event) => {
            setWordmark(event.target.value)
            patchIntro({ wordmark: event.target.value })
          },
        })),
        field(t('intro.skip'), t('intro.skipHint'), h(Toggle, {
          checked: intro.skip,
          label: t('intro.skip'),
          onChange: (next) => { patchIntro({ skip: next }) },
        })),
        h('div', { className: 'dshap-row' },
          h('div', { className: 'dshap-desc' }, t('intro.previewHint')),
          h('button', {
            type: 'button',
            className: 'dshap-btn dshap-btn-strong',
            onClick: preview,
            disabled: previewing,
          }, previewing ? t('preview.on') : t('intro.preview'))))
    }

    function AppearanceSection() {
      const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
      return React.createElement('div', { className: 'dshap-page' },
        React.createElement('div', { className: 'dshap-group' }, t('group.background')),
        React.createElement(BackgroundItem, { snapshot }),
        React.createElement('div', { className: 'dshap-group' }, t('group.intro')),
        React.createElement(IntroItems, { snapshot }),
      )
    }

    // ------------------------------------------------------------------- apply

    // The intro starts as early as the module allows, so it covers the boot the
    // way the shell's own cover would. A module evaluated before <body> exists
    // mounts on DOMContentLoaded rather than skipping the opening entirely.
    // This runs before `apply`: the cover is part of the boot, not a response to
    // a later UI state.
    function launchIntro() {
      if (!state.intro.enabled) return
      startIntro(state.intro, false)
    }

    if (document.body !== null) launchIntro()
    else document.addEventListener('DOMContentLoaded', launchIntro, { once: true })

    return {
      inject: ['slots', 'theme'],

      apply(ctx) {
        const theme = ctx.get('theme')

        function syncWallpaper() {
          paintWallpaper(theme)
        }

        ctx.effect(() => {
          const style = document.createElement('style')
          style.id = 'dsh-appearance-settings-css'
          style.textContent = SETTINGS_CSS
          document.head.append(style)

          // A URL that refused measurement (no CORS) still renders; the size is
          // filled in later so framing can switch to the pixel path.
          let measured = ''
          function backfillSize() {
            const background = state.background
            if (background.image === '' || background.size !== null) return
            if (background.image === measured) return
            measured = background.image
            void measureImage(background.image).then((size) => {
              if (size === null || state.background.image !== background.image) return
              patchBackground({ size })
            })
          }

          syncWallpaper()
          backfillSize()

          // The cover math depends on the viewport, so repaint on resize.
          let pending = 0
          const onResize = () => {
            if (pending !== 0) return
            pending = window.requestAnimationFrame(() => {
              pending = 0
              paintWallpaper(theme)
            })
          }
          window.addEventListener('resize', onResize)

          // The override layer composes with whatever theme is active, so a
          // theme switch needs no re-push; only local edits do.
          const offStore = subscribe(() => {
            syncWallpaper()
            backfillSize()
          })

          return () => {
            offStore()
            window.removeEventListener('resize', onResize)
            if (pending !== 0) cancelAnimationFrame(pending)
            clearWallpaper(theme)
            style.remove()
            activeIntro?.dispose()
            activeIntro = null
          }
        })

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'appearance',
          order: 5,
          label: () => t('section.title'),
        }, AppearanceSection))
      },
    }
  },
})
