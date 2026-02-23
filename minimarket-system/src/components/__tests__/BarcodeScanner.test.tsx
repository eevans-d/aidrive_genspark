import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BarcodeScanner from '../BarcodeScanner'

const decodeFromVideoDeviceMock = vi.fn()
const resetMock = vi.fn()

vi.mock('@zxing/library', () => {
  class NotFoundException extends Error {}
  class MockBrowserMultiFormatReader {
    decodeFromVideoDevice(...args: unknown[]) {
      return decodeFromVideoDeviceMock(...args)
    }

    reset() {
      return resetMock()
    }
  }

  return {
    BrowserMultiFormatReader: MockBrowserMultiFormatReader,
    NotFoundException,
  }
})

describe('BarcodeScanner smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    decodeFromVideoDeviceMock.mockResolvedValue(undefined)
  })

  it('does not render when inactive', () => {
    render(<BarcodeScanner onScan={vi.fn()} isActive={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Ingreso manual')).not.toBeInTheDocument()
  })

  it('renders camera mode by default when active', () => {
    render(<BarcodeScanner onScan={vi.fn()} isActive={true} onClose={vi.fn()} />)
    expect(screen.getByText('Ingreso manual')).toBeInTheDocument()
    expect(screen.getByText('Apunte al código de barras')).toBeInTheDocument()
  })

  it('switches to manual mode and submits scanned code', () => {
    const onScan = vi.fn()
    render(<BarcodeScanner onScan={onScan} isActive={true} onClose={vi.fn()} />)

    const manualToggle = screen.queryByText('Ingreso manual')
    if (manualToggle) {
      fireEvent.click(manualToggle)
    }

    const input = screen.getByPlaceholderText('Código de barras o nombre...')
    fireEvent.change(input, { target: { value: ' 7791234567890 ' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    expect(onScan).toHaveBeenCalledWith('7791234567890')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<BarcodeScanner onScan={vi.fn()} isActive={true} onClose={onClose} />)

    const buttons = screen.getAllByRole('button')
    const closeButton = buttons[1]
    expect(closeButton).toBeDefined()
    if (!closeButton) return
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
