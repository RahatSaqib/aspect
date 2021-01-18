import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Base } from '../stories/AspectLink.stories'

describe('AspectLink', () => {
  it('should render AspectLink correctly', () => {
    const { getByText } = render(<Base {...Base.args} />)
    expect(getByText('AspectLink')).toBeInTheDocument()
  })
})
