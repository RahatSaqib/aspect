import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'

import PersonTableRow from './PersonTableRow'

describe('PersonTableRow component', () => {
  const renderer = new ReactShallowRenderer()
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

  it('should shallow render correctly', () => {
    const element = renderer.render(<PersonTableRow {...props} />)

    expect(element).toMatchSnapshot()
  })
})
