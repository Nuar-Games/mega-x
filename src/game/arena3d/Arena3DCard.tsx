import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { ArenaCardRef } from '../arena/ArenaStateAdapter'

export type Arena3DCardProps = {
  card: ArenaCardRef | null
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  dimmed?: boolean
  onPrimary?: (actionId: string) => void
  onSecondary?: (card: ArenaCardRef) => void
  qaId?: string
}

type TexturedArenaCardProps = {
  card: ArenaCardRef
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  dimmed: boolean
  onPrimary?: (actionId: string) => void
  onSecondary?: (card: ArenaCardRef) => void
  qaId?: string
}

type QaHitGeometry = {
  qaId: string
  alt: string
  src: string
  actionId?: string
  actions?: { id: string; label: string }[]
  polygon: { x: number; y: number }[]
  bounds: { left: number; top: number; right: number; bottom: number }
}

type QaWindow = Window & {
  __mx3dQaHitGeometry?: Record<string, QaHitGeometry>
  __mx3dQaLastActivated?: { qaId: string; alt: string; actionId?: string; at: number }
}

const qaHitboxMode = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('qa3dHitboxes') === '1'

export function Arena3DCard({
  card,
  position,
  rotation = [-Math.PI / 2, 0, 0],
  scale = 1,
  dimmed = false,
  onPrimary,
  onSecondary,
  qaId,
}: Arena3DCardProps) {
  if (!card) return null

  return (
    <TexturedArenaCard
      card={card}
      position={position}
      rotation={rotation}
      scale={scale}
      dimmed={dimmed}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      qaId={qaId}
    />
  )
}

function TexturedArenaCard({
  card,
  position,
  rotation,
  scale,
  dimmed,
  onPrimary,
  onSecondary,
  qaId,
}: TexturedArenaCardProps) {
  const texture = useTexture(card.src)
  const press = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const hitTarget = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.max(texture.anisotropy, 4)

  const width = 1.42 * scale
  const height = 2.03 * scale
  const actionable = Boolean(card.actionId || card.actions?.length)

  useFrame(() => {
    if (!qaId || !qaHitboxMode() || !hitTarget.current) return
    const canvasRect = gl.domElement.getBoundingClientRect()
    if (!canvasRect.width || !canvasRect.height) return
    hitTarget.current.updateWorldMatrix(true, false)
    const polygon = [
      new THREE.Vector3(-width / 2, -height / 2, 0),
      new THREE.Vector3(width / 2, -height / 2, 0),
      new THREE.Vector3(width / 2, height / 2, 0),
      new THREE.Vector3(-width / 2, height / 2, 0),
    ].map(point => {
      hitTarget.current!.localToWorld(point)
      point.project(camera)
      return {
        x: canvasRect.left + (point.x + 1) * canvasRect.width / 2,
        y: canvasRect.top + (1 - point.y) * canvasRect.height / 2,
      }
    })
    const xs = polygon.map(point => point.x)
    const ys = polygon.map(point => point.y)
    const qaWindow = window as QaWindow
    qaWindow.__mx3dQaHitGeometry ??= {}
    qaWindow.__mx3dQaHitGeometry[qaId] = {
      qaId,
      alt: card.alt,
      src: card.src,
      actionId: card.actionId,
      actions: card.actions,
      polygon,
      bounds: {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
      },
    }
  })

  const activate = () => {
    if (qaId && qaHitboxMode()) {
      ;(window as QaWindow).__mx3dQaLastActivated = { qaId, alt: card.alt, actionId: card.actionId, at: Date.now() }
    }
    if (card.actionId) {
      onPrimary?.(card.actionId)
      return
    }
    onSecondary?.(card)
  }
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    press.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const start = press.current
    press.current = null
    if (!start || start.pointerId !== event.pointerId) return
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (moved > 22) return
    activate()
  }
  const handlePointerCancel = () => {
    press.current = null
  }

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <mesh ref={hitTarget} name="mx3d-hit-target" position={[0, 0, -0.012]} scale={[1.24, 1.18, 1]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.035, 0]} scale={[1.07, 1.07, 1]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color={actionable ? '#d6b34e' : '#071018'}
          transparent
          opacity={actionable ? 0.24 : 0.16}
        />
      </mesh>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={dimmed ? 0.46 : 1}
          roughness={0.58}
          metalness={0.02}
          emissive={actionable ? '#241b08' : '#000000'}
          emissiveIntensity={actionable ? 0.5 : 0}
        />
      </mesh>
    </group>
  )
}
