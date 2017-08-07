import React from 'react'
import { Redirect } from 'react-router-dom'

export default ({ location }) =>
  <Redirect
    to={{
      pathname: '/dashboard',
      state: { referrer: location },
    }}
  />
