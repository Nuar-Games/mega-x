import { test, expect, type Page } from 'playwright/test'

// This test drives the 3D arena with REAL pointer input. Guest entry must follow
// the same shared lobby flow as registered players before Practice starts.
// It then proves the exact SET_VS sequence that was reported broken:
//
//   landing -> shared lobby -> practice
//   click card -> choose ATK/DEF -> exact card enters authoritative VS
//   -> exact card mesh appears in the 3D VS centerpiece
//   -> card leaves hand -> stale SET_VS actions clear -> next phase appears.

type QaHitGeometry = {
  qaId: string
  alt: string
  src: string
  actionId?: string
  actions?: { id: string; label: string }[]
  bounds: { left: number; top: number; right: number; bottom: number }
}
type QaWindow = Window & { __mx3dQaHitGeometry?: Record<string, QaHitGeometry> }

async function readHitGeometry(page: Page): Promise<Record<string,QaHitGeometry>> {
  return page.evaluate(() => (window as unknown as QaWindow).__mx3dQaHitGeometry || {})
}

async function readHandHitGeometry(page: Page): Promise<QaHitGeometry[]> {
  const geometry=await readHitGeometry(page)
  return Object.values(geometry).filter((entry) => entry.qaId.startsWith('hand-'))
}

test('SET_VS: shared guest lobby -> real pointer -> ATK/DEF -> visible 3D VS card -> next phase', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/?qa3dHitboxes=1')

  // Guest must enter the SAME lobby first; landing may never start Practice directly.
  const landingCta = page.locator('#mx-main-practice-cta')
  await expect(landingCta).toBeVisible({ timeout: 15_000 })
  await landingCta.click()

  // Practice is started from inside the shared lobby.
  const practiceEntry = page.locator('.mx-practice-entry[data-practice-entry="true"]')
  await expect(practiceEntry).toBeVisible({ timeout: 15_000 })
  await practiceEntry.click()

  // Wait for the 3D scene to mount and report projected screen geometry.
  await page.waitForFunction(
    () => Object.keys((window as unknown as QaWindow).__mx3dQaHitGeometry || {}).some((id) => id.startsWith('hand-')),
    { timeout: 20_000 },
  )

  let target: QaHitGeometry | undefined
  await expect(async () => {
    const hand = await readHandHitGeometry(page)
    target = hand.find((card) => (card.actions?.length ?? 0) >= 2)
    expect(target, 'no SET_VS-eligible hand card found (expected ATK/DEF choice)').toBeTruthy()
  }).toPass({ timeout: 15_000 })

  const clickedCard = target!
  const clickedSrc = clickedCard.src
  const clickedFile = clickedSrc.split('/').pop()!
  const cx = (clickedCard.bounds.left + clickedCard.bounds.right) / 2
  const cy = (clickedCard.bounds.top + clickedCard.bounds.bottom) / 2
  await page.mouse.click(cx, cy)

  const chooser = page.locator('.mx3d-chooser')
  await expect(chooser).toBeVisible({ timeout: 10_000 })
  const choiceButtons = chooser.locator('button.mx3-choice, button.mx3d-choice')
  const labels = (await choiceButtons.allTextContents()).map((text) => text.trim().toUpperCase())
  expect(labels.some((label) => label.includes('ATK'))).toBe(true)
  expect(labels.some((label) => label.includes('DEF'))).toBe(true)

  await chooser.getByRole('button', { name: /ATK/i }).click()
  await expect(chooser).toBeHidden({ timeout: 10_000 })

  // Authoritative hidden DOM: the exact selected card must enter the local VS zone.
  const localVsSelector = await page.evaluate(() => {
    const leftFighter = document.querySelector('.mx3-fighter-left')
    const localSide = leftFighter?.classList.contains('is-local') ? 'left' : 'right'
    return localSide === 'left' ? '.mx3-vs-left img' : '.mx3-vs-right img'
  })

  await expect(async () => {
    const vsSrc = await page.locator(localVsSelector).getAttribute('src')
    expect(vsSrc, 'authoritative local VS zone never showed the clicked card').toContain(clickedFile)
  }).toPass({ timeout: 15_000 })

  // Actual 3D surface: the same card must mount as the local VS mesh with a real
  // projected on-screen rectangle. Hidden DOM success alone does not satisfy this test.
  await expect(async () => {
    const geometry=await readHitGeometry(page)
    const visibleVs=geometry['local-vs']
    expect(visibleVs, '3D local VS card mesh never mounted').toBeTruthy()
    expect(visibleVs.src, '3D local VS mesh is not the selected card').toContain(clickedFile)
    expect(visibleVs.bounds.right-visibleVs.bounds.left, '3D VS mesh has no visible width').toBeGreaterThan(20)
    expect(visibleVs.bounds.bottom-visibleVs.bounds.top, '3D VS mesh has no visible height').toBeGreaterThan(20)
  }).toPass({ timeout: 15_000 })

  await expect(async () => {
    const hand = await readHandHitGeometry(page)
    expect(hand.some((card) => card.src === clickedSrc), 'clicked card is still present in the 3D hand').toBe(false)
  }).toPass({ timeout: 15_000 })

  await expect(async () => {
    const hand = await readHandHitGeometry(page)
    const stillOfferingVs = hand.filter((card) => card.actions?.some((action) => /ATK|DEF/i.test(action.label)))
    expect(stillOfferingVs, `stale ATK/DEF actions survived on: ${stillOfferingVs.map((c) => c.alt).join(', ')}`).toHaveLength(0)
  }).toPass({ timeout: 15_000 })

  await expect(async () => {
    const beginRound = await page.locator('.mx3-begin-round').count()
    const phase = await page.evaluate(() => document.querySelector('.mx3-canvas')?.className.match(/phase-(\S+)/)?.[1] || '')
    expect(beginRound > 0 || phase !== 'set_vs', `no next action appeared (phase=${phase})`).toBe(true)
  }).toPass({ timeout: 20_000 })
})
