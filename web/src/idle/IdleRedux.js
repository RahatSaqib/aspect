import configure from 'redux-idle-monitor'

import config from '../config'
import { idleLogout } from '../auth/AuthRedux'

const IDLESTATUS_AWAY = 'AWAY'
const IDLESTATUS_INACTIVE = 'INACTIVE'
const IDLESTATUS_EXPIRED = 'EXPIRED'

// actions
const idleStatusDelay = idleStatus => () => {
  if (idleStatus === IDLESTATUS_AWAY) {
    return 20 * 1000
  } // User becomes away after 20 seconds inactivity
  if (idleStatus === IDLESTATUS_INACTIVE) {
    return config.userInactiveMinutes * 60 * 1000
  } // inactive after X minutes
  if (idleStatus === IDLESTATUS_EXPIRED) {
    return 60 * 1000
  }
  return 20 * 1000
}

const activeStatusAction = () => {}

const idleStatusAction = idleStatus => dispatch => {
  if (idleStatus === IDLESTATUS_EXPIRED) {
    return dispatch(idleLogout())
  }
}

// configure idle monitor
const opts = {
  appName: 'aspect',
  IDLE_STATUSES: [IDLESTATUS_AWAY, IDLESTATUS_INACTIVE, IDLESTATUS_EXPIRED],
  idleStatusDelay,
  activeStatusAction,
  idleStatusAction,
}

const { middleware, reducer, actions } = configure(opts)

export { middleware, actions }

export default reducer
