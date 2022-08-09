import noop from 'lodash/noop'
import React from 'react'
import { mount } from 'enzyme'
import Immutable from 'immutable'
import LinearProgress from '@mui/material/LinearProgress'
import * as reactRedux from 'react-redux'

import { QueryClient, QueryClientProvider } from 'react-query'
import { Site } from '../../site/SiteRedux'
import { SiteDetail } from './SiteDetail'
import { I18nProvider } from '../../Providers/I18nProvider/index'

const SiteDetailComponent = props => (
  <QueryClientProvider client={new QueryClient()}>
    <I18nProvider>
      <SiteDetail {...props} />
    </I18nProvider>
  </QueryClientProvider>
)

describe('SiteDetail component', () => {
  let spies = []

  beforeAll(() => {
    jest.mock('react-router-dom', () => ({
      useParams: () => ({ siteId: '1' }),
    }))
    jest.mock('react-redux', () => ({
      connect: jest.fn(),
    }))

    spies = [
      jest.spyOn(reactRedux, 'useSelector').mockReturnValue({
        editable: true,
        site: new Site(),
        siteTags: Immutable.List(),
        siteContacts: Immutable.List(),
      }),
    ]
  })
  afterAll(() => {
    spies.forEach(spy => spy.mockRestore())
    jest.unmock('react-router-dom')
    jest.unmock('react-redux')
  })

  const props = {
    navigate: jest.fn(),
    location: {},
    // redux actions
    fetchSingleSite: noop,
    updateSingleSiteFromForm: noop,
    fetchSiteContacts: noop,
    fetchTags: noop,
    updateTags: noop,
    updateLatLongFromFormAddress: noop,
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
