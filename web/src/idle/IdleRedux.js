import _ from 'lodash'
import configure from 'redux-idle-monitor'

import config from '../config'
import { logoutStart } from '../auth/AuthRedux'

const types = {
  IDLESTATUS_AWAY: 'IDLESTATUS_AWAY',
  IDLESTATUS_INACTIVE: 'IDLESTATUS_INACTIVE',
  IDLESTATUS_EXPIRED: 'IDLESTATUS_EXPIRED'
}

// actions
const idleStatusDelay = idleStatus => () => {
  if (idleStatus === types.IDLESTATUS_AWAY) {
    return 20000
  } // User becomes away after 20 seconds inactivity
  if (idleStatus === types.IDLESTATUS_INACTIVE) {
    return config.userInactiveMinutes * 60 * 1000
  } // inactive after X minutes
  if (idleStatus === types.IDLESTATUS_EXPIRED) {
    return 60000
  }
  return 20000
}

const activeStatusAction = () => {}

const idleStatusAction = idleStatus => (dispatch) => {
  if (idleStatus === types.IDLESTATUS_EXPIRED) {
    dispatch(logoutStart('idle'))
  }
}

// configure idle monitor
const opts = {
  appName: 'aspect',
  IDLE_STATUSES: _.values(types),
  idleStatusDelay,
  activeStatusAction,
  idleStatusAction
}

const { middleware, reducer, actions } = configure(opts)

export { middleware, actions }

export default reducer
