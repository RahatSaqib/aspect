import React from 'react'
import { render } from '@testing-library/react'
import SiteMap from './SiteMap'

describe('SiteMap Component', () => {
  const props = {
    position: {
      lat: 41.1176358,
      lng: -81.48574129999997,
    },
  }

  it('should render without crash', () => {
    const { container } = render(<SiteMap {...props} />)

    expect(container.firstChild).toBeInTheDocument()
  })
})
