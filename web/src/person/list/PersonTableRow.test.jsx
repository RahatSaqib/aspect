import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'

import PersonTableRow from './PersonTableRow'

describe('PersonTableRow component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
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
