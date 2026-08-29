export type PositionSwitchLocks = [boolean, boolean]

export function lockNextPositionSwitch(locks: PositionSwitchLocks, target: 0 | 1): PositionSwitchLocks {
  const next: PositionSwitchLocks = [...locks] as PositionSwitchLocks
  next[target] = true
  return next
}

export function consumePositionSwitchLock(locks: PositionSwitchLocks, target: 0 | 1): PositionSwitchLocks {
  if (!locks[target]) return locks
  const next: PositionSwitchLocks = [...locks] as PositionSwitchLocks
  next[target] = false
  return next
}

export function isPositionSwitchLocked(locks: PositionSwitchLocks, target: 0 | 1): boolean {
  return locks[target]
}
