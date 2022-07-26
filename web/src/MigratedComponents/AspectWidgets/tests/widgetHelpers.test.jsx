import React from 'react'
import Immutable from 'immutable'
import { renderHook } from '@testing-library/react-hooks'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import AspectLink from '../../AspectLink'
import { buildWidgetToLinkParams } from '../Helpers'
import { useUserIsPermitted, RoutesPermissionProvider } from '../../../Providers/RoutePermissions'
import { links, users } from './mocks'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

describe('buildWidgetToLinkParams', () => {
  users.map(({ key, permissions }) => {
    const User = Immutable.Record({
      jwt: { permissions },
    })
    const reduxState = { user: new User() }
    const store = createStore(reducer, reduxState || initialState)
    const wrapper = ({ children, widgetToLink }) => (
      <Provider store={store}>
        <MemoryRouter>
          <RoutesPermissionProvider>
            <Routes>
              <Route path="/dashboard" permissions={['dashboard:summary']} />
              <Route path="/task-list" permissions={['task']} />
              <Route path="/task-list/aggre-list" permissions={['task']} />
              <Route path="/task-list/:taskId" permissions={['task']} />
              <Route path="/operational-data" permissions={['operationalData']} />
              <Route path="/account-details/current" permissions={['account']} />
              <Route path="/demo/device/:deviceId" permissions={['deviceDemo']} />
              <Route path="/clinical-indicators" permissions={['clinicalIndicators:view']} />
              <Route path="/reports" permissions={['report']} />
              <Route path="/manage" permissions={['manage']} />
              <Route path="/browse" permissions={['browse']} />
              <Route exact path="/browse/device" permissions={['browse', 'device']} />
              <Route path="/browse/device/:deviceId" permissions={['browse', 'device']} />
              <Route path="/browse/case/:caseId" permissions={['browse', 'case:edit']} />
              <Route path="/browse/patient/:patientId" permissions={['browse', 'patient:edit']} />
              <Route exact path="/browse/deviceApiKey" permissions={['browse', 'deviceApiKey']} />
              <Route exact path="/browse/case" permissions={['browse', 'case']} />
              <Route exact path="/browse/MemoryRouter" permissions={['browse', 'router']} />
              <Route path="/browse/router/:routerId" permissions={['browse', 'router']} />
              <Route exact path="/browse/reporter" permissions={['browse', 'reporter']} />
              <Route exact path="/browse/result" permissions={['browse', 'result']} />
              <Route path="/browse/result/:resultId" permissions={['browse', 'result:edit']} />
              <Route exact path="/browse/site" permissions={['browse', 'site']} />
              <Route path="/browse/site/:siteId" permissions={['browse', 'site']} />
              <Route exact path="/browse/person" permissions={['browse', 'person']} />
              <Route path="/browse/person/:personId" permissions={['browse', 'person:edit']} />
              <Route exact path="/browse/inventory" permissions={['browse', 'inventory']} />
              <Route exact path="/browse/notification" permissions={['browse', 'notification']} />
              <Route path="/browse/notification/:notificationId" permissions={['browse', 'notification:edit']} />
              <Route path="/browse/report" permissions={['browse', 'report']} />
              <AspectLink to={widgetToLink} testId="SummaryStatus--Summary_Link">
                {children}
              </AspectLink>
            </Routes>
          </RoutesPermissionProvider>
        </MemoryRouter>
      </Provider>
    )
    return links.map(async ({ link, linkParams, expected }) => {
      const widgetToLink = buildWidgetToLinkParams(link, linkParams)
      const {
        result: {
          current: { isPermitted },
        },
      } = renderHook(() => useUserIsPermitted(link), {
        wrapper,
        initialProps: {
          widgetToLink,
        },
      })
      return it(`${key} is ${isPermitted ? '**ALLOWED** to access' : '**RESTRICTED** access to'} ${link}`, () => {
        expect(expected.allowed).toEqual(widgetToLink)
      })
    })
  })
})
