import { useEffect, useRef, useState } from 'react'
import './AppOpenHook.css'

// Fires once per browser session, before the person has signed in or seen the
// lobby — the "first 5 seconds" hook. Deliberately has NO dependency on a real
// match, session, or backend call: it must render instantly on a cold load.
// The hero clash image is optional (/ui/landing/vs-clash-splash.avif — the
// asset being generated separately); if it's missing this still renders a
// full CSS-only energy-burst treatment so nothing looks broken in the
// meantime. Tap/click/key anywhere skips immediately — this should feel
// unmissable, never feel like it's blocking someone who's already seen it.
const HOOK_SEEN_KEY = 'mx-cold-open-seen-v1'
const CLASH_IMAGE_SRC = '/ui/landing/vs-clash-splash.avif'
const AUTO_COMPLETE_MS = 3200

export function shouldShowAppOpenHook() {
  try {
    return sessionStorage.getItem(HOOK_SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

type Props = { onComplete: () => void }

export function AppOpenHook({ onComplete }: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      try {
        sessionStorage.setItem(HOOK_SEEN_KEY, '1')
      } catch {
        /* private browsing / storage disabled — fine, just replays next load */
      }
      onComplete()
    }
    const timer = window.setTimeout(finish, AUTO_COMPLETE_MS)
    const skip = () => finish()
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [onComplete])

  return (
    <main className="app mx-cold-open-root" aria-hidden="true">
      <section className="mx-cold-open">
        <div className="mx-cold-open-grid" />
        <div className="mx-cold-open-speedlines mx-cold-open-speedlines-left" />
        <div className="mx-cold-open-speedlines mx-cold-open-speedlines-right" />
        {!imageFailed ? (
          <img
            className="mx-cold-open-clash"
            src={CLASH_IMAGE_SRC}
            alt=""
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="mx-cold-open-clash mx-cold-open-clash-fallback">
            <div className="mx-cold-open-fallback-half mx-cold-open-fallback-left" />
            <div className="mx-cold-open-fallback-half mx-cold-open-fallback-right" />
          </div>
        )}
        <div className="mx-cold-open-impact-ring" />
        <div className="mx-cold-open-lens-flare" />
        <img className="mx-cold-open-logo" src="/ui/landing/logo.avif" alt="MEGA-X" />
        <div className="mx-cold-open-skip">TAP TO SKIP</div>
      </section>
    </main>
  )
}
