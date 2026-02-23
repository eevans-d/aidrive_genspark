import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  SkeletonTable,
  SkeletonText,
} from '../Skeleton'

describe('Skeleton smoke', () => {
  it('renders SkeletonCard with pulse class', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('renders SkeletonText with custom width', () => {
    const { container } = render(<SkeletonText width="w-1/2" />)
    expect(container.firstChild).toHaveClass('w-1/2')
  })

  it('renders SkeletonTable rows', () => {
    const { container } = render(<SkeletonTable />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders chart and list variants', () => {
    const chart = render(<SkeletonChart />)
    const list = render(<SkeletonList />)

    expect(chart.container.firstChild).toHaveClass('animate-pulse')
    expect(list.container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
