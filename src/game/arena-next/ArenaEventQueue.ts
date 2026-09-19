import type { ArenaEventEnvelope } from './ArenaEvents'

export class ArenaEventQueue {
  private matchId: string | null = null
  private settledVersion = -1
  private lastSequence = -1
  private readonly items: ArenaEventEnvelope[] = []

  get size() {
    return this.items.length
  }

  resetForState(matchId: string, settledVersion: number) {
    this.matchId = matchId
    this.settledVersion = settledVersion
    this.lastSequence = -1
    this.items.length = 0
  }

  enqueue(envelope: ArenaEventEnvelope) {
    if (!this.matchId) this.matchId = envelope.matchId
    if (envelope.matchId !== this.matchId) return false
    if (envelope.toVersion < envelope.fromVersion) return false
    if (envelope.toVersion <= this.settledVersion) return false
    if (envelope.sequence <= this.lastSequence) return false

    this.items.push(envelope)
    this.lastSequence = envelope.sequence
    return true
  }

  peek() {
    return this.items[0] ?? null
  }

  shift() {
    return this.items.shift() ?? null
  }

  clear() {
    this.items.length = 0
  }
}
