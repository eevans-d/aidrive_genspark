import { describe, it, expect, vi } from 'vitest'
import { authEvents } from '../authEvents'

describe('authEvents', () => {
  it('notifies subscribed listeners on emit', () => {
    const listener = vi.fn()
    const unsubscribe = authEvents.on(listener)

    authEvents.emit('auth_required')

    expect(listener).toHaveBeenCalledWith('auth_required')
    unsubscribe()
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = authEvents.on(listener)

    unsubscribe()
    authEvents.emit('auth_required')

    expect(listener).not.toHaveBeenCalled()
  })
})
