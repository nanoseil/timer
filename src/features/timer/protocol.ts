import type { TimerCommand, TimerSnapshot } from './timerState'

export type ClientRole = 'display' | 'control'

export type TimerClientMessage = {
  type: 'command'
  command: TimerCommand
} | {
  type: 'chime'
}

export type TimerServerMessage =
  | {
    type: 'snapshot'
    snapshot: TimerSnapshot
  }
  | {
    type: 'chime'
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
    case 'set-alarms':
      return (
        Array.isArray(value.elapsedMs) &&
        value.elapsedMs.every((elapsedMs) => typeof elapsedMs === 'number')
      )
    case 'add-time':
      return typeof value.deltaMs === 'number'
    default:
      return false
  }
}

export function parseTimerClientMessage(raw: unknown): TimerClientMessage | null {
  if (!isRecord(raw) || typeof raw.type !== 'string') {
    return null
  }

  if (raw.type === 'chime') {
    return {
      type: 'chime',
    }
  }

  if (raw.type === 'command') {
    if (!isTimerCommand(raw.command)) {
      return null
    }

    return {
      type: 'command',
      command: raw.command,
    }
  }

  return null
}

export function formatDuration(remainingMs: number): string {
  if (remainingMs < 0) {
    const totalSeconds = Math.floor(Math.abs(remainingMs) / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${remainingMs < -1000 ? '-' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
