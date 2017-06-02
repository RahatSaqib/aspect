import React, { Children } from 'react'
import { Redirect } from 'react-router-dom'

import {
  hasBlankOrExpiredJWT,
  getRefreshToken,
} from '../../shared/utils/localStorage'

export const EnsureAuthorized = ({ children, location, refreshStart }) => {
  // TODO: check access level based on tokens/permissions in jwt
  if (hasBlankOrExpiredJWT()) {
    // try to refresh if we have a refresh token
    // if not, redirect to login
    if (getRefreshToken()) {
      refreshStart()
    } else {
      return (
        <Redirect
          to={{
            pathname: '/login',
            state: { referrer: location },
          }}
        />
      )
    }
  }
  return Children.only(children)
}

export default EnsureAuthorized
