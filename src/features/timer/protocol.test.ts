import { describe, expect, test } from 'vitest'
import { formatDuration } from './protocol'

describe('formatDuration', () => {
  test('shows zero in the last positive sub-second', () => {
    expect(formatDuration(999)).toBe('00:00')
  })

  test('does not skip to minus two right after crossing zero', () => {
    expect(formatDuration(-1_500)).toBe('-00:01')
  })
})
