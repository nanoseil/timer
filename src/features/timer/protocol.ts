import type { TimerCommand, TimerSnapshot } from './timerState'

export type ClientRole = 'display' | 'control'

export type TimerClientMessage = {
  type: 'command'
  command: TimerCommand
}

export type TimerServerMessage =
  | {
      type: 'snapshot'
      snapshot: TimerSnapshot
    }
  | {
      type: 'error'
      message: string
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTimerCommand(value: unknown): value is TimerCommand {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  switch (value.type) {
    case 'start':
    case 'pause':
    case 'reset':
      return true
    case 'set-duration':
      return typeof value.durationMs === 'number'
    case 'add-time':
      return typeof value.deltaMs === 'number'
    default:
      return false
  }
}

export function parseTimerClientMessage(raw: unknown): TimerClientMessage | null {
  if (!isRecord(raw) || raw.type !== 'command') {
    return null
  }

  if (!isTimerCommand(raw.command)) {
    return null
  }

  return {
    type: 'command',
    command: raw.command,
  }
}

export function formatDuration(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

