import noop from 'lodash/noop'
import React from 'react'
import { mount } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'
import LinearProgress from '@material-ui/core/LinearProgress'

import { Site } from '../SiteRedux'
import { SiteDetail } from './SiteDetail'

describe('SiteDetail component', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    match: {
      params: {
        siteId: '1',
      },
      path: '/browse/site/1/alerts',
      url: '/browe/site',
    },
    history: {},
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
    mount(<SiteDetail {...props} />)
  })

  it('should show a progress bar in each tab', () => {
    const wrapper = mount(<SiteDetail {...props} />)
    const site = Immutable.List()
    wrapper.setProps({ site })
    expect(wrapper.children().find(LinearProgress)).toHaveLength(1)
  })
})
