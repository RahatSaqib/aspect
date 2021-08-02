import Immutable from 'immutable'
import noop from 'lodash/noop'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { PersonDetail } from './PersonDetail'

function makeContext(userPermissions) {
  return Immutable.fromJS({
    jwt: {
      permissions: Immutable.Set(userPermissions),
    },
    countryId: 1,
  })
}
describe('PersonDetail module', () => {
  const props = {
    location: { pathname: '' },
    intl: createIntl({ locale: 'en' }),
    editable: false,
    user: makeContext(['person:edit']),
    person: Immutable.fromJS({
      name: 'Admin',
      level: 'Admin',
      state: 'Lagos',
      lga: 'Apapa',
    }),
    showAcknowledgement: noop,
    fetchSinglePerson: noop,
    createPerson: noop,
    updateSinglePerson: noop,
    updateSinglePersonLoginDetails: noop,
    updateSinglePersonUserPreferences: noop,
    fetchPartnersAndJobFunctionsForSelectList: noop,
    isNew: false,
    addPersonAssignment: noop,
    deletePersonAssignment: noop,
  }

  describe('Person Detail component', () => {
    it('should render correctly', () => {
      const element = shallow(<PersonDetail {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
