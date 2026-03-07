import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime } from './dateUtils'

describe('formatRelativeTime', () => {
  let now

  beforeEach(() => {
    now = new Date('2026-03-07T12:00:00')
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Just now" for times less than 60 seconds ago', () => {
    const date = new Date('2026-03-07T11:59:30').toISOString()
    expect(formatRelativeTime(date)).toBe('Just now')
  })

  it('should return minutes ago for times less than 60 minutes ago', () => {
    const date = new Date('2026-03-07T11:30:00').toISOString()
    expect(formatRelativeTime(date)).toBe('30m ago')
  })

  it('should return hours ago for times less than 24 hours ago', () => {
    const date = new Date('2026-03-07T09:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('3h ago')
  })

  it('should return "Yesterday" for 1 day ago', () => {
    const date = new Date('2026-03-06T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('Yesterday')
  })

  it('should return days ago for times less than 7 days ago', () => {
    const date = new Date('2026-03-04T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('3d ago')
  })

  it('should return "1 week ago" for 7 days ago', () => {
    const date = new Date('2026-02-28T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('1 week ago')
  })

  it('should return weeks ago for times less than 4 weeks ago', () => {
    const date = new Date('2026-02-21T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('2 weeks ago')
  })

  it('should return "1 month ago" for 30 days ago', () => {
    const date = new Date('2026-02-05T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('1 month ago')
  })

  it('should return months ago for times less than 12 months ago', () => {
    const date = new Date('2026-01-06T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('2 months ago')
  })

  it('should return "1 year ago" for 365 days ago', () => {
    const date = new Date('2025-03-07T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('1 year ago')
  })

  it('should return years ago for times more than 1 year ago', () => {
    const date = new Date('2024-03-07T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('2 years ago')
  })

  it('should handle edge case at 59 seconds', () => {
    const date = new Date('2026-03-07T11:59:01').toISOString()
    expect(formatRelativeTime(date)).toBe('Just now')
  })

  it('should handle edge case at exactly 60 seconds', () => {
    const date = new Date('2026-03-07T11:59:00').toISOString()
    expect(formatRelativeTime(date)).toBe('1m ago')
  })

  it('should handle edge case at 23 hours', () => {
    const date = new Date('2026-03-06T13:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('23h ago')
  })

  it('should handle edge case at exactly 24 hours (Yesterday)', () => {
    const date = new Date('2026-03-06T12:00:00').toISOString()
    expect(formatRelativeTime(date)).toBe('Yesterday')
  })
})
