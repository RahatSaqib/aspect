import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'

import { ReporterDetail } from './ReporterDetail'

describe('ReporterDetail component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    editable: false,
    fetchSingleReporter: () => {},
    updateSingleReporter: () => {},
    location: {
      search: '',
    },
    match: {
      params: {
        reporterId: '1',
      },
    },
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ReporterDetail {...props} />)

    expect(element).toMatchSnapshot()
  })
})
