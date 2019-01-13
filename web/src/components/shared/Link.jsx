import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { compose, withHandlers, pure } from 'recompose'
import MUILink from '@material-ui/core/Link'

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

const Link = ({
  label,
  history,
  location,
  onLinkClick,
  theme,
  ...restProps
}) => (
  <MUILink
    {...restProps}
    onClick={onLinkClick}
    className={classNames(theme.link, {
      [theme.active]: new RegExp(`^${restProps.href}`).test(location.pathname),
    })}
  >
    <abbr>{label}</abbr>
  </MUILink>
)

export default enhance(Link)
