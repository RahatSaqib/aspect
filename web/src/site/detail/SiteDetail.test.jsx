import _ from 'lodash'
import React from 'react'
import { mount } from 'enzyme'
import { IntlProvider } from 'react-intl'
import Immutable from 'immutable'
import LinearProgress from '@material-ui/core/LinearProgress'

import { Site } from '../SiteRedux'
import { SiteDetail } from './SiteDetail'

describe('SiteDetail component', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
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
    onSiteTagChange: _.noop,
    fetchSingleSite: _.noop,
    updateSingleSiteFromForm: _.noop,
    fetchSiteContacts: _.noop,
    fetchTags: _.noop,
    updateTags: _.noop,
    updateLatLongFromFormAddress: _.noop,
    onDoNotAcceptClick: _.noop,
    onAcceptClick: _.noop,
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
