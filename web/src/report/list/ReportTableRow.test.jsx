import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'

import ReportTableRow from './ReportTableRow'

describe('ReportTableRow component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    report: Immutable.fromJS({
      id: '1',
      deploymentName: 'PIH Lilongwe',
      moduleSerial: 998533,
      dateOfError: '2016-03-12',
      error: '401',
      totalTestsRun: 2030,
      totalErrors: 7,
    }),
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<ReportTableRow {...props} />)

    expect(element).toMatchSnapshot()
  })
})
