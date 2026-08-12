import React from 'react'
import { render, screen } from '@testing-library/react'
import noop from 'lodash/noop'
import { createIntl } from 'react-intl'
import { License } from './License'

describe('License component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    licenseContent: 'License here!\nYou better accept!',
    onDoNotAcceptClick: noop,
    onAcceptClick: noop,
  }

  it('should render without crash', () => {
    render(<License {...props} />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('should render the license content with newlines replaced', () => {
    const { container } = render(<License {...props} />)
    const paragraphs = container.querySelectorAll('p')

    expect(paragraphs[0]).toHaveTextContent('License here!')
    expect(paragraphs[1]).toHaveTextContent('You better accept!')
  })
})
