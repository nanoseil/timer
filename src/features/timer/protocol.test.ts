import { describe, expect, test } from 'vitest'
import { formatDuration, parseTimerClientMessage } from './protocol'

describe('formatDuration', () => {
  test('keeps one-second display in the last positive sub-second', () => {
    expect(formatDuration(999)).toBe('00:01')
  })

  test('does not skip to minus two right after crossing zero', () => {
    expect(formatDuration(-1_500)).toBe('-00:01')
  })
})

describe('parseTimerClientMessage', () => {
  test('accepts chime payload', () => {
    expect(parseTimerClientMessage({ type: 'chime' })).toEqual({ type: 'chime' })
  })

  test('rejects unknown payload type', () => {
    expect(parseTimerClientMessage({ type: 'unknown' })).toBeNull()
  })
})
