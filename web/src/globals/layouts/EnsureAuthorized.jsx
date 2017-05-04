import PropTypes from 'prop-types'
import { PureComponent, Children } from 'react'

import { hasBlankOrExpiredJWT, getRefreshToken } from '../../shared/utils/localStorage'

const ensureAuthorized = (refreshStart, history, location) => {
  // TODO: check access level based on tokens/permissions in jwt
  if (hasBlankOrExpiredJWT()) {
    // try to refresh if we have a refresh token
    // if not, redirect to login
    if (getRefreshToken()) {
      refreshStart()
    } else {
      history.replace({
        pathname: '/login',
        state: { nextPathname: location.pathname }
      })
    }
  }
}

export class EnsureAuthorized extends PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    refreshStart: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  componentWillMount() {
    const { refreshStart, history, location } = this.props
    ensureAuthorized(refreshStart, history, location)
  }

  componentWillReceiveProps(nextProps) {
    const { refreshStart, history, location } = nextProps
    ensureAuthorized(refreshStart, history, location)
  }

  render() {
    return Children.only(this.props.children)
  }
}

export default EnsureAuthorized
