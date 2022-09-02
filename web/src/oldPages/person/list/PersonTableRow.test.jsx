import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { createIntl } from 'react-intl'
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
