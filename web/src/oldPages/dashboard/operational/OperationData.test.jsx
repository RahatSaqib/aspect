import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import OperationalData from './OperationalData'

describe('OperationData Component', () => {
  it('should shallow render without crash', () => {
    shallow(
      <IntlProvider locale="en">
        <OperationalData />
      </IntlProvider>
    )
  })
})
