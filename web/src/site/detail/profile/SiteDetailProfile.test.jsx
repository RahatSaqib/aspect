import React from 'react'
import { shallow } from 'enzyme'
import { fromJS } from 'immutable'

import SiteDetailProfile from './SiteDetailProfile'

describe('SiteDetailProfile Component', () => {
  const props = {
    site: fromJS({
      name: 'Cuyahoga County Ohio #2',
      shortName: 'Cuyahoga, OH #2',
      externalId: 'Ohio_2',
      zip: '12345-13',
      state: 'Ohio',
      city: 'Cuyahoga City',
      lga: 'Cuyahoga',
      cname: 'Joe Doe',
      devices: [
        { name: 'Daktari Virology at Suffolk', id: 6 },
        { name: 'GeneXpert at Suffolk', id: 4 },
      ],
      contacts: [{ id: 1, name: 'contact' }],
    }),
    siteTags: [{ title: 'tag1' }],
    formatMessage: message => message.defaultMessage,
    history: {},
    location: {},
    match: {},
    disabled: true,
  }

  it('should shallow render without crash', () => {
    shallow(<SiteDetailProfile {...props} />)
  })
})
