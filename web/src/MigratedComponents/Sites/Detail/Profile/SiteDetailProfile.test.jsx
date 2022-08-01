import React from 'react'
import { shallow } from 'enzyme'
import { fromJS } from 'immutable'

import { QueryClient, QueryClientProvider } from 'react-query'
import SiteDetailProfile from './SiteDetailProfile'

describe('SiteDetailProfile Component', () => {
  const props = {
    site: fromJS({
      id: '50',
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
    siteContacts: [{ id: 1, name: 'Joe Doe' }],
    formatMessage: message => message.defaultMessage,
    navigate: jest.fn(),
    location: {},
    match: {},
    disabled: true,
    user: { countryAbbreviation: 'US' },
  }

  it('should shallow render without crash', () => {
    shallow(
      <QueryClientProvider client={new QueryClient()}>
        <SiteDetailProfile {...props} />
      </QueryClientProvider>
    )
  })
})
