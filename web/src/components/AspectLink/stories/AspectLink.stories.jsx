import React, { Fragment } from 'react'
import Immutable from 'immutable'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { RoutesPermissionProvider } from '../../../providers/RoutePermissions'
import AspectLink from '../index'
import { permissions, links } from '../tests/mocks'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

export default {
  title: 'components/AspectLink',
  argTypes: {
    Permissions: {
      defaultValue: 'browse, device',
      control: {
        type: 'select',
        options: permissions,
      },
      table: {
        type: {
          summary: 'test different permissions',
          detail: 'not part of original props',
        },
        defaultValue: { summary: 'browse, device' },
        disable: false,
      },
      controls: { disable: false },
    },
    to: {
      defaultValue: '/browse/site',
      control: {
        type: 'select',
        options: links,
      },
    },
    className: { table: { disable: true }, controls: { disable: true } },
    children: { table: { disable: true }, controls: { disable: true } },
  },
  component: AspectLink,
}

const RenderTo = () => <div />

const Template = ({ to, Permissions: permissions, ...rest }) => {
  const User = Immutable.Record({
    jwt: { permissions: permissions.replace(/ /g, '').split(',') },
  })
  const reduxState = { user: new User() }
  const store = createStore(reducer, reduxState || initialState)
  return (
    <Provider store={store}>
      <MemoryRouter>
        <RoutesPermissionProvider>
          <Fragment>
            <Routes>
              <Route exact path="/browse/site" element={<RenderTo permissions={['browse', 'site']} />} />
              <Route path="/browse/site/:siteId" element={<RenderTo permissions={['browse', 'site:edit']} />} />
              <Route exact path="/browse/person" element={<RenderTo permissions={['browse', 'person']} />} />
              <Route path="/browse/person/:personId" element={<RenderTo permissions={['browse', 'person:edit']} />} />
              <Route path="*" element={<div>Not Found</div>} />
            </Routes>
            <AspectLink {...rest} to={to}>
              Link
            </AspectLink>
          </Fragment>
        </RoutesPermissionProvider>
      </MemoryRouter>
    </Provider>
  )
}

export const Base = Template.bind({})
