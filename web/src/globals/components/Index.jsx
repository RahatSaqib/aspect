import React from 'react'
import { Redirect } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose } from 'recompose'

import { refreshStart } from '../../auth/AuthRedux'
import EnsureAuthorized from '../layouts/EnsureAuthorized'

const enhance = compose(
  connect(
    () => ({}),
    dispatch =>
      bindActionCreators(
        {
          refreshStart,
        },
        dispatch
      )
  )
)

export const Index = ({ location }) =>
  <EnsureAuthorized refreshStart={refreshStart} location={location}>
    <Redirect
      to={{
        pathname: '/dashboard',
        state: { referrer: location },
      }}
    />
  </EnsureAuthorized>

export default enhance(Index)
