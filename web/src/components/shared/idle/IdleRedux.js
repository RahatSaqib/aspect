import _ from 'lodash'
import configure from 'redux-idle-monitor'
import config from 'config'

import { logoutStart } from './../../../action_creators/user_creators'

const types = {
  IDLESTATUS_AWAY: 'IDLESTATUS_AWAY',
  IDLESTATUS_INACTIVE: 'IDLESTATUS_INACTIVE',
  IDLESTATUS_EXPIRED: 'IDLESTATUS_EXPIRED'
}

// actions
const idleStatusDelay = idleStatus => () => {
  if(idleStatus === types.IDLESTATUS_AWAY)
    return 20000 // User becomes away after 20 seconds inactivity
  if(idleStatus === types.IDLESTATUS_INACTIVE)
    return config.userInactiveMinutes * 60 * 1000 // inactive after X minutes
  if(idleStatus === types.IDLESTATUS_EXPIRED)
    return 60000 // Log them out one minute after they enter the inactive status
}

const activeStatusAction = () => {}

const idleStatusAction = idleStatus => (dispatch) => {

  if(idleStatus === types.IDLESTATUS_INACTIVE){
  }

  if(idleStatus === types.IDLESTATUS_EXPIRED){
    dispatch(logoutStart('idle'))
  }
}

// configure idle monitor
const opts =  { appName: 'aspect'
              , IDLE_STATUSES: _.values(types)
              , idleStatusDelay
              , activeStatusAction
              , idleStatusAction
              }

const { middleware, reducer, actions } = configure(opts)
export { middleware, reducer, actions }
