import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'

import ReportTableRow from './ReportTableRow'

describe('ReportTableRow component', () => {
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

  it('should shallow render without crash', () => {
    shallow(<ReportTableRow {...props} />)
  })
})
