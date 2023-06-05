import Immutable from 'immutable'
import { downloadFile } from '../utils/utils/files'

export const types = {
  GLOBALS_SET_LAST_SERVER_RESPONSE_TIME: 'GLOBALS_SET_LAST_SERVER_RESPONSE_TIME',
  EXPORT_RESPONSE_FILE_RECEIVED: 'EXPORT_RESPONSE_FILE_RECEIVED',
  EXPORT_FILE_STARTED: 'EXPORT_FILE_STARTED',
}

/*
 * ---------------- Action Creators -----------------
 */

export function setLastServerResponseTime(serverTime) {
  return {
    type: types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME,
    serverTime,
  }
}

export function receivedExportResponse(blob, format, reportName) {
  downloadFile(blob, reportName, format)
  return {
    type: types.EXPORT_RESPONSE_FILE_RECEIVED,
    blob,
    format,
    reportName,
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Globals = Immutable.Record({
  lastServerResponseTime: new Date(),
  downloadStarted: false,
})

const initialState = new Globals()

export default function globalsReducer(state = initialState, action) {
  switch (action.type) {
    case types.EXPORT_RESPONSE_FILE_RECEIVED: {
      return state.set('downloadStarted', false)
    }
    case types.EXPORT_FILE_STARTED: {
      return state.set('downloadStarted', true)
    }
    case types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
      return state.set('lastServerResponseTime', action.serverTime)
    default:
      return state
  }
}
