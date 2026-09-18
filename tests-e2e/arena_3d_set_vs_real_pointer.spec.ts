import { test, expect, type Page } from 'playwright/test'

// This test drives the 3D arena with REAL pointer input (page.mouse / page.click,
// which dispatch genuine browser pointer events at real screen coordinates —
// never React's synthetic event system directly, never dispatchArena3DAction
// called from test code). It proves the exact sequence that was found broken:
//
//   click card (real pointer, via its projected 3D screen bounds)
//     -> choose ATK/DEF (real pointer, on the rendered chooser button)
//     -> that exact card leaves the hand
//     -> it appears in the VS zone
//     -> SET_VS is no longer offered on the remaining hand cards
//     -> the next legal action appears (MULA PUSINGAN, or the next phase)
//
// It reads two sources of truth, both already authoritative elsewhere in this
// codebase: window.__mx3dQaHitGeometry (real projected screen-space bounds for
// each 3D hand card, from Arena3DCard's own qa-hitbox instrumentation — enabled
// via ?qa3dHitboxes=1) for *where to click*, and the hidden legacy DOM that
// ArenaStateAdapter reads (and that the 3D scene is driven by) for *what actually
// happened*. A card's identity is its image path (`src`) — each of the 30 cards
// has a distinct file, so comparing src before/after is a sound identity check
// without needing to add a new debug hook into the practice engine.

type QaHitGeometry = {
  qaId: string
  alt: string
  src: string
  actionId?: string
  actions?: { id: string; label: string }[]
  bounds: { left: number; top: number; right: number; bottom: number }
}
type QaWindow = Window & { __mx3dQaHitGeometry?: Record<string, QaHitGeometry> }

async function readHandHitGeometry(page: Page): Promise<QaHitGeometry[]> {
  return page.evaluate(() => {
    const geometry = (window as unknown as QaWindow).__mx3dQaHitGeometry || {}
    return Object.values(geometry).filter((entry) => entry.qaId.startsWith('hand-'))
  })
}

test('SET_VS: real pointer click -> ATK/DEF -> card enters VS zone -> hand actions clear -> next phase appears', async ({ page }) => {
  await page.goto('/?qa3dHitboxes=1')

  // Enter a fully local, zero-network practice match as a guest.
  const practiceButton = page.locator('.mx-practice-now')
  await expect(practiceButton).toBeVisible({ timeout: 15_000 })
  await practiceButton.click()

  // Wait for the 3D scene to actually mount and start reporting real projected
  // hit geometry for hand cards (proves the canvas is live and hittable, not
  // just that some app state changed).
  await page.waitForFunction(
    () => Object.keys((window as unknown as QaWindow).__mx3dQaHitGeometry || {}).some((id) => id.startsWith('hand-')),
    { timeout: 15_000 },
  )

  // Find a hand card that is currently offering the SET_VS ATK/DEF choice —
  // i.e. it has two dispatchable actions rather than a single primary action.
  let target: QaHitGeometry | undefined
  await expect(async () => {
    const hand = await readHandHitGeometry(page)
    target = hand.find((card) => (card.actions?.length ?? 0) >= 2)
    expect(target, 'no SET_VS-eligible hand card found (expected ATK/DEF choice on at least one card)').toBeTruthy()
  }).toPass({ timeout: 10_000 })
  const clickedCard = target!
  const clickedSrc = clickedCard.src

  // Real pointer click at the card's actual on-screen center, computed from its
  // true projected 3D bounds — this goes through the canvas's real hit-testing,
  // not a synthetic event dispatched directly at a React handler.
  const cx = (clickedCard.bounds.left + clickedCard.bounds.right) / 2
  const cy = (clickedCard.bounds.top + clickedCard.bounds.bottom) / 2
  await page.mouse.click(cx, cy)

  // The ATK/DEF chooser is a real DOM overlay (Arena3DHUD), not WebGL — it must
  // appear with exactly the two choices the card actually offered.
  const chooser = page.locator('.mx3d-chooser')
  await expect(chooser).toBeVisible({ timeout: 5_000 })
  const choiceButtons = chooser.locator('button.mx3-choice, button.mx3d-choice')
  const labels = (await choiceButtons.allTextContents()).map((text) => text.trim().toUpperCase())
  expect(labels.some((label) => label.includes('ATK'))).toBe(true)
  expect(labels.some((label) => label.includes('DEF'))).toBe(true)

  // Real pointer click on the rendered ATK button.
  await chooser.getByRole('button', { name: /ATK/i }).click()

  // The chooser must close on a real, successful dispatch — not linger stale.
  await expect(chooser).toBeHidden({ timeout: 5_000 })

  // Determine which side is "local" from the authoritative DOM (same lookup
  // ArenaStateAdapter itself uses), then poll until the exact clicked card's
  // image is showing in that side's VS zone.
  const localVsSelector = await page.evaluate(() => {
    const leftFighter = document.querySelector('.mx3-fighter-left')
    const localSide = leftFighter?.classList.contains('is-local') ? 'left' : 'right'
    return localSide === 'left' ? '.mx3-vs-left img' : '.mx3-vs-right img'
  })

  await expect(async () => {
    const vsSrc = await page.locator(localVsSelector).getAttribute('src')
    expect(vsSrc, 'local VS zone never showed the clicked card').toContain(clickedSrc.split('/').pop()!)
  }).toPass({ timeout: 10_000 })

  // The exact clicked card must no longer be present among hand cards at all —
  // not merely "not offering an action", genuinely gone from the hand.
  await expect(async () => {
    const hand = await readHandHitGeometry(page)
    expect(hand.some((card) => card.src === clickedSrc), 'clicked card is still present in the hand').toBe(false)
  }).toPass({ timeout: 10_000 })

  // No remaining hand card may still offer a SET_VS ATK/DEF choice — the round
  // only needs one VS card, so every other hand card's action set must clear.
  await expect(async () => {
    const hand = await readHandHitGeometry(page)
    const stillOfferingVs = hand.filter((card) => card.actions?.some((action) => /ATK|DEF/i.test(action.label)))
    expect(stillOfferingVs, `stale ATK/DEF actions survived on: ${stillOfferingVs.map((c) => c.alt).join(', ')}`).toHaveLength(0)
  }).toPass({ timeout: 10_000 })

  // A legal next action must actually appear — MULA PUSINGAN if both sides are
  // ready, otherwise the phase must have moved on from SET_VS for the local side.
  await expect(async () => {
    const beginRound = await page.locator('.mx3-begin-round').count()
    const phase = await page.evaluate(() => document.querySelector('.mx3-canvas')?.className.match(/phase-(\S+)/)?.[1] || '')
    expect(beginRound > 0 || phase !== 'set_vs', `no next action appeared (phase=${phase})`).toBe(true)
  }).toPass({ timeout: 15_000 })
})
