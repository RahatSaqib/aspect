import React from 'react'
import { Route } from 'react-router'

import UIProviders from './UIProviders'
import ScrollToTopOnUpdate from './ScrollToTopOnUpdate'

const PlainLayout = ({
  component: Component,
  ...restProps
}) => (
  <Route
    {...restProps}
    render={props => (
      <UIProviders>
        <ScrollToTopOnUpdate
          location={props.location}
        >
          <Component {...props} />
        </ScrollToTopOnUpdate>
      </UIProviders>
    )}
  />
)

export default PlainLayout
