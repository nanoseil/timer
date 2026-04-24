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

  test('running timer continues past zero in snapshot', () => {
    const base = createDefaultTimerState()
    const short = applyTimerCommand(base, { type: 'set-duration', durationMs: 20_000 }, 0)
    const started = applyTimerCommand(short, { type: 'start' }, 1_000)
    const { nextState, snapshot } = createTimerSnapshot(started, 31_000)

    expect(snapshot.remainingMs).toBe(-10_000)
    expect(snapshot.isRunning).toBe(true)
    expect(nextState.isRunning).toBe(true)
  })

  test('set-alarms stores sorted unique elapsed timings', () => {
    const base = createDefaultTimerState()
    const tenMinutes = applyTimerCommand(
      base,
      { type: 'set-duration', durationMs: 10 * 60_000 },
      0,
    )
    const changed = applyTimerCommand(
      tenMinutes,
      {
        type: 'set-alarms',
        elapsedMs: [8 * 60_000, 5 * 60_000, 8 * 60_000, -1_000, 0],
      },
      1_000,
    )

    expect(changed.alarmElapsedMs).toEqual([5 * 60_000, 8 * 60_000])
  })

  test('set-duration drops alarm timings beyond new total duration', () => {
    const base = createDefaultTimerState()
    const withAlarms = applyTimerCommand(
      base,
      {
        type: 'set-alarms',
        elapsedMs: [2 * 60_000, 4 * 60_000],
      },
      0,
    )
    const shortened = applyTimerCommand(
      withAlarms,
      { type: 'set-duration', durationMs: 3 * 60_000 },
      1_000,
    )

    expect(shortened.alarmElapsedMs).toEqual([2 * 60_000])
  })
})
