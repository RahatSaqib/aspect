import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'

import PersonTableRow from './PersonTableRow'

describe('PersonTableRow component', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    person: Immutable.fromJS({
      name: 'Admin',
      level: 'Admin',
      state: 'Lagos',
      lga: 'Apapa',
    }),
  }

  it('should shallow render without crash', () => {
    shallow(<PersonTableRow {...props} />)
  })
})
