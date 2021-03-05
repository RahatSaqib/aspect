import React from './react'
import { render } from './@testing-library/react'
import './@testing-library/jest-dom/extend-expect'

import { Default } from '../stories/I18nProvider.stories'

describe('I18nProvider', () => {
  it('should render I18nProvider correctly', () => {
    const { getByText } = render(<Default {...Default.args} />)
    // intentionally failing to remember to add tests
    expect(getByText('I18nProvider')).toBeInTheDocument()
  })
})
