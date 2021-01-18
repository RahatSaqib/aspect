import React, { Fragment } from 'react'
import Immutable from 'immutable'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { MemoryRouter, Route } from 'react-router-dom'

import { RoutesPermissionProvider } from '../../../Hooks/RoutePermissions'
import AspectLink from '../index'

const initialState = {
  permissions: null,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

export const links = [
  '/browse/site',
  '/browse/site/209',
  '/browse/person',
  '/browse/person/9',
  'https://google.com',
]

export const permissions = [
  'browse, device',
  'browse, site',
  'browse, site:edit',
  'browse, person',
  'browse, person:edit',
]

export default {
  title: 'Components/AspectLink',
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
            <Route exact path="/browse/site" permissions={['browse', 'site']} />
            <Route
              path="/browse/site/:siteId"
              permissions={['browse', 'site:edit']}
            />
            <Route
              exact
              path="/browse/person"
              permissions={['browse', 'person']}
            />
            <Route
              path="/browse/person/:personId"
              permissions={['browse', 'person:edit']}
            />
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
