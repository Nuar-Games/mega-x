import { useRef } from 'react'
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
}

type TexturedArenaCardProps = {
  card: ArenaCardRef
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  dimmed: boolean
  onPrimary?: (actionId: string) => void
  onSecondary?: (card: ArenaCardRef) => void
}

export function Arena3DCard({
  card,
  position,
  rotation = [-Math.PI / 2, 0, 0],
  scale = 1,
  dimmed = false,
  onPrimary,
  onSecondary,
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
}: TexturedArenaCardProps) {
  const texture = useTexture(card.src)
  const press = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.max(texture.anisotropy, 4)

  const width = 1.42 * scale
  const height = 2.03 * scale
  const actionable = Boolean(card.actionId || card.actions?.length)
  const activate = () => {
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
      <mesh name="mx3d-hit-target" position={[0, 0, -0.012]} scale={[1.24, 1.18, 1]}>
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
