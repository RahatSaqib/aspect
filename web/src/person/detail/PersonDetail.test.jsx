import Immutable from 'immutable'
import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { PersonDetail } from './PersonDetail'

function makeContext(userPermissions) {
  return {
    jwt: {
      permissions: Immutable.Set(userPermissions),
    },
  }
}
describe('PersonDetail module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    editable: false,
    user: makeContext(['person:edit']),
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
    createPerson: _.noop,
    updateSinglePerson: _.noop,
    updateSinglePersonLoginDetails: _.noop,
    updateSinglePersonUserPreferences: _.noop,
    fetchPartnersAndJobFunctionsForSelectList: _.noop,
    isNew: false,
    addPersonAssignment: _.noop,
    deletePersonAssignment: _.noop,
  }

  describe('Person Detail component', () => {
    it('should render correctly', () => {
      const element = shallow(<PersonDetail {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
