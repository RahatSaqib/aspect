import React from 'react'
import { mount } from 'enzyme'
import Immutable from 'immutable'
import noop from 'lodash/noop'
import { QueryClient, QueryClientProvider } from 'react-query'
import * as reactRedux from 'react-redux'
import { I18nProvider } from '../../../providers/I18nProvider/index'
import { Site } from '../../../store/SiteRedux'
import { SiteDetail } from './SiteDetail'

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
})
