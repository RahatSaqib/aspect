import noop from 'lodash/noop'
import React from 'react'
import { mount } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'
import LinearProgress from '@material-ui/core/LinearProgress'

import { Site } from '../../../site/SiteRedux'
import { SiteDetail } from './SiteDetail'

const SiteDetailComponent = props => (
  <IntlProvider locale="en">
    <SiteDetail {...props} />
  </IntlProvider>
)

describe('SiteDetail component', () => {
  const props = {
    match: {
      params: {
        siteId: '1',
      },
      path: '/browse/site/:siteId/alerts',
      url: '/browe/site',
    },
    navigate: jest.fn(),
    location: {},
    editable: true,
    site: new Site(),
    siteTags: Immutable.List(),
    siteContacts: Immutable.List(),
    onSiteTagChange: noop,
    fetchSingleSite: noop,
    updateSingleSiteFromForm: noop,
    fetchSiteContacts: noop,
    fetchTags: noop,
    updateTags: noop,
    updateLatLongFromFormAddress: noop,
    onDoNotAcceptClick: noop,
    onAcceptClick: noop,
  }

  it('should render without crashing', () => {
    mount(<SiteDetailComponent {...props} />)
  })

  it('should show a progress bar in each tab', () => {
    const wrapper = mount(<SiteDetailComponent {...props} />)
    const site = Immutable.List()
    wrapper.setProps({ site })
    expect(wrapper.children().find(LinearProgress)).toHaveLength(1)
  })
})
