import { describe, expect, test } from 'vitest'
import {
  applyTimerCommand,
  createDefaultTimerState,
  createTimerSnapshot,
} from './timerState'

describe('timer state transitions', () => {
  test('start then pause keeps elapsed time', () => {
    const base = createDefaultTimerState()
    const started = applyTimerCommand(base, { type: 'start' }, 1_000)
    const paused = applyTimerCommand(started, { type: 'pause' }, 11_000)

    expect(paused.isRunning).toBe(false)
    expect(paused.remainingMs).toBe(290_000)
  })

  test('set-duration resets timer and stops it', () => {
    const base = createDefaultTimerState()
    const started = applyTimerCommand(base, { type: 'start' }, 0)
    const changed = applyTimerCommand(
      started,
      { type: 'set-duration', durationMs: 90_000 },
      15_000,
    )

    expect(changed.isRunning).toBe(false)
    expect(changed.totalDurationMs).toBe(90_000)
    expect(changed.remainingMs).toBe(90_000)
  })

  test('running timer auto-clamps at zero in snapshot', () => {
    const base = createDefaultTimerState()
    const short = applyTimerCommand(base, { type: 'set-duration', durationMs: 20_000 }, 0)
    const started = applyTimerCommand(short, { type: 'start' }, 1_000)
    const { nextState, snapshot } = createTimerSnapshot(started, 31_000)

    expect(snapshot.remainingMs).toBe(0)
    expect(snapshot.isRunning).toBe(false)
    expect(nextState.isRunning).toBe(false)
  })
})

