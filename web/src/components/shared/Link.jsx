import _ from 'lodash'
import React from 'react'
import { compose, withHandlers, pure } from 'recompose'
import RTLink from 'react-toolbox/lib/link'

const enhance = compose(
  withHandlers({
    onLinkClick: ({ onClick = _.noop, history, disabled }) => event => {
      event.preventDefault()
      if (disabled) {
        return
      }
      const { currentTarget } = event
      const { pathname } = currentTarget
      history.push(pathname)
      onClick(event)
    },
  }),
  pure
)

const Link = ({ history, location, onLinkClick, ...restProps }) => (
  <RTLink
    {...restProps}
    active={new RegExp(`^${restProps.href}`).test(location.pathname)}
    onClick={onLinkClick}
  />
)

export default enhance(Link)
