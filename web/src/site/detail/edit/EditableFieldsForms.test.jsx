import React from 'react'
import { shallow } from 'enzyme'
import { fromJS } from 'immutable'

import EditableFieldsForm from './EditableFieldsForm'

describe('EditableFieldsForm Component', () => {
  const props = {
    initialValues: fromJS({
      address: '13 Main Street',
      address2: '',
      city: 'Cuyahoga City',
      country: 'United States',
      countryId: '3',
      externalId: 'Ohio_2',
      lga: 'Cuyahoga',
      lgaId: '13',
      name: 'Cuyahoga County Ohio #2',
      shortName: 'Cuyahoga, OH #2',
      state: 'Ohio',
      stateId: '67',
      timezone: '',
      zip: '12345-13',
    }),
    labels: {
      address: 'Address',
      address2: 'Address 2',
      city: 'City',
      externalId: 'Site ID',
      name: 'Name',
      shortName: 'ShortName',
      timezone: 'Time Zone',
      zip: 'Zip',
    },
    updateLatLongFromFormAddress: () => {},
    handlesubmit: () => {},
    presitine: false,
    submiting: false,
  }

  it('should shallow render without crash', () => {
    shallow(<EditableFieldsForm {...props} />)
  })
})
