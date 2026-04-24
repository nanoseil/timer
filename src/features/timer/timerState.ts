export interface RoomTimerState {
  totalDurationMs: number
  remainingMs: number
  isRunning: boolean
  startedAtMs: number | null
  alarmElapsedMs: number[]
  revision: number
}

export interface TimerSnapshot {
  totalDurationMs: number
  remainingMs: number
  isRunning: boolean
  alarmElapsedMs: number[]
  revision: number
  serverNowMs: number
}

export const DEFAULT_DURATION_MS = 5 * 60 * 1000
export const MIN_DURATION_MS = 10 * 1000
export const MAX_DURATION_MS = 12 * 60 * 60 * 1000

export function createDefaultTimerState(): RoomTimerState {
  return {
    totalDurationMs: DEFAULT_DURATION_MS,
    remainingMs: DEFAULT_DURATION_MS,
    isRunning: false,
    startedAtMs: null,
    alarmElapsedMs: [],
    revision: 0,
  }
}

export function clampDurationMs(durationMs: number): number {
  const safe = Number.isFinite(durationMs) ? Math.trunc(durationMs) : MIN_DURATION_MS
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, safe))
}

export function clampRemainingMs(remainingMs: number): number {
  const safe = Number.isFinite(remainingMs) ? Math.trunc(remainingMs) : 0
  return Math.min(MAX_DURATION_MS, Math.max(0, safe))
}

export function normalizeAlarmElapsedMs(
  alarmElapsedMs: number[],
  totalDurationMs: number,
): number[] {
  const unique = new Set<number>()

  for (const elapsedMs of alarmElapsedMs) {
    if (!Number.isFinite(elapsedMs)) {
      continue
    }

    const safeElapsedMs = Math.trunc(elapsedMs)
    if (safeElapsedMs <= 0 || safeElapsedMs >= totalDurationMs) {
      continue
    }
    unique.add(safeElapsedMs)
  }

  return Array.from(unique).sort((a, b) => a - b)
}

export function getRemainingMsAt(
  state: Pick<RoomTimerState, 'isRunning' | 'startedAtMs' | 'remainingMs'>,
  nowMs: number,
): number {
  if (!state.isRunning || state.startedAtMs === null) {
    return state.remainingMs
  }

  const elapsedMs = Math.max(0, nowMs - state.startedAtMs)
  return state.remainingMs - elapsedMs
}

export type TimerCommand =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'set-duration'; durationMs: number }
  | { type: 'set-alarms'; elapsedMs: number[] }
  | { type: 'add-time'; deltaMs: number }

export function applyTimerCommand(
  state: RoomTimerState,
  command: TimerCommand,
  nowMs: number,
): RoomTimerState {
  const normalized = state

  switch (command.type) {
    case 'start': {
      if (normalized.isRunning || normalized.remainingMs <= 0) {
        return normalized
      }

      return {
        ...normalized,
        isRunning: true,
        startedAtMs: nowMs,
        revision: normalized.revision + 1,
      }
    }
    case 'pause': {
      if (!normalized.isRunning) {
        return normalized
      }

      return {
        ...normalized,
        isRunning: false,
        startedAtMs: null,
        remainingMs: getRemainingMsAt(normalized, nowMs),
        revision: normalized.revision + 1,
      }
    }
    case 'reset': {
      if (
        !normalized.isRunning &&
        normalized.remainingMs === normalized.totalDurationMs
      ) {
        return normalized
      }

      return {
        ...normalized,
        isRunning: false,
        startedAtMs: null,
        remainingMs: normalized.totalDurationMs,
        revision: normalized.revision + 1,
      }
    }
    case 'set-duration': {
      const durationMs = clampDurationMs(command.durationMs)
      const alarmElapsedMs = normalizeAlarmElapsedMs(
        normalized.alarmElapsedMs,
        durationMs,
      )
      if (
        !normalized.isRunning &&
        normalized.totalDurationMs === durationMs &&
        normalized.remainingMs === durationMs &&
        normalized.alarmElapsedMs.length === alarmElapsedMs.length &&
        normalized.alarmElapsedMs.every((value, index) => value === alarmElapsedMs[index])
      ) {
        return normalized
      }

      return {
        ...normalized,
        totalDurationMs: durationMs,
        remainingMs: durationMs,
        isRunning: false,
        startedAtMs: null,
        alarmElapsedMs,
        revision: normalized.revision + 1,
      }
    }
    case 'set-alarms': {
      const alarmElapsedMs = normalizeAlarmElapsedMs(
        command.elapsedMs,
        normalized.totalDurationMs,
      )
      if (
        normalized.alarmElapsedMs.length === alarmElapsedMs.length &&
        normalized.alarmElapsedMs.every((value, index) => value === alarmElapsedMs[index])
      ) {
        return normalized
      }

      return {
        ...normalized,
        alarmElapsedMs,
        revision: normalized.revision + 1,
      }
    }
    case 'add-time': {
      const currentRemainingMs = getRemainingMsAt(normalized, nowMs)
      const nextRemainingMs = clampRemainingMs(
        currentRemainingMs + Math.trunc(command.deltaMs),
      )

      if (nextRemainingMs === currentRemainingMs) {
        return normalized
      }

      if (normalized.isRunning && nextRemainingMs > 0) {
        return {
          ...normalized,
          remainingMs: nextRemainingMs,
          startedAtMs: nowMs,
          revision: normalized.revision + 1,
        }
      }

      return {
        ...normalized,
        isRunning: false,
        startedAtMs: null,
        remainingMs: nextRemainingMs,
        revision: normalized.revision + 1,
      }
    }
  }
}

export function createTimerSnapshot(
  state: RoomTimerState,
  nowMs: number,
): { nextState: RoomTimerState; snapshot: TimerSnapshot } {
  const remainingMs = getRemainingMsAt(state, nowMs)

  return {
    nextState: state,
      snapshot: {
        totalDurationMs: state.totalDurationMs,
        remainingMs,
        isRunning: state.isRunning,
        alarmElapsedMs: state.alarmElapsedMs,
        revision: state.revision,
        serverNowMs: nowMs,
      },
  }
}
