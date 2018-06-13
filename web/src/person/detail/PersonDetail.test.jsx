import Immutable from 'immutable'
import _ from 'lodash'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'
import { PersonDetail } from './PersonDetail'

function makeContext(userPermissions) {
  return {
    jwt: {
      permissions: Immutable.Set(userPermissions),
    },
  }
}
describe('PersonDetail module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
    editable: false,
    user: makeContext(['person:admin']),
    match: {
      params: {
        reporterId: '1',
      },
    },
    person: Immutable.fromJS({
      name: 'Admin',
      level: 'Admin',
      state: 'Lagos',
      lga: 'Apapa',
    }),
    showAcknowledgement: _.noop,
    fetchSinglePerson: _.noop,
    updateSinglePerson: _.noop,
    updateSinglePersonLoginDetails: _.noop,
    updateSinglePersonUserPreferences: _.noop,
    fetchPartnersAndJobFunctionsForSelectList: _.noop,
  }

  describe('Person Detail component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<PersonDetail {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
