import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useScanListener } from '../useScanListener'

function Harness({
  onScan,
  withInput = false,
  enabled = true,
}: {
  onScan: (value: string) => void
  withInput?: boolean
  enabled?: boolean
}) {
  useScanListener({ onScan, enabled, minLength: 4, maxIntervalMs: 50 })
  return withInput ? <input data-testid="scan-input" /> : <div>listener</div>
}

function typeBarcode(value: string) {
  value.split('').forEach((char) => {
    fireEvent.keyDown(document, { key: char })
  })
  fireEvent.keyDown(document, { key: 'Enter' })
}

describe('useScanListener', () => {
  it('emits scan when barcode is typed and no input is focused', () => {
    const onScan = vi.fn()
    render(<Harness onScan={onScan} />)

    typeBarcode('7791234')

    expect(onScan).toHaveBeenCalledWith('7791234')
  })

  it('does not emit scan when an input is focused', () => {
    const onScan = vi.fn()
    const { getByTestId } = render(<Harness onScan={onScan} withInput={true} />)

    getByTestId('scan-input').focus()
    typeBarcode('7791234')

    expect(onScan).not.toHaveBeenCalled()
  })

  it('does not emit when listener is disabled', () => {
    const onScan = vi.fn()
    render(<Harness onScan={onScan} enabled={false} />)

    typeBarcode('7791234')

    expect(onScan).not.toHaveBeenCalled()
  })
})
